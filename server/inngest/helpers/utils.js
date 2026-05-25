const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { supabase } = require("../../config/supabase");
const { LANGUAGE_NAME_TO_STT_CODE } = require("./constants");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isFonadaProvider(voice_obj, language_obj) {
  const voiceModel = (voice_obj?.model || "").toLowerCase();
  const langModel = (language_obj?.modelName || "").toLowerCase();
  return voiceModel.includes("fonada") || langModel.includes("fonada");
}

function resolveSTTLanguageCode(language_obj) {
  if (language_obj?.modelLanguageCode) {
    return language_obj.modelLanguageCode.split("-")[0];
  }
  if (language_obj?.language) {
    return LANGUAGE_NAME_TO_STT_CODE[language_obj.language.toLowerCase()] || "en";
  }
  return "en";
}

function getSceneCount(duration) {
  const map = {
    "0-30": 4,
    "30-50": 5,
    "30-60": 5,
    "50-60": 5,
    "60-70": 6,
    "60-90": 7,
  };
  return map[duration] ?? 4;
}

// Estimate spoken duration from word count (~130 words/min average)
function estimateDurationSeconds(text) {
  if (!text) return 5;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil((wordCount / 130) * 60);
}

// Download a URL to a local tmp file, returns the local path
async function downloadToTmp(url, suffix) {
  const baseTmp = path.resolve(os.tmpdir(), "nxtai");
  if (!fs.existsSync(baseTmp)) fs.mkdirSync(baseTmp, { recursive: true });
  
  const tmpPath = path.join(baseTmp, `${Date.now()}_${suffix}`);
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(tmpPath, Buffer.from(res.data));
  return tmpPath;
}

// Upload a buffer directly to Supabase storage
async function uploadBufferToSupabase(bufferOrArrayBuffer, storagePath, contentType) {
  // Ensure we have an ArrayBuffer as Supabase SDK likes it
  let arrayBuffer;
  if (Buffer.isBuffer(bufferOrArrayBuffer)) {
    arrayBuffer = bufferOrArrayBuffer.buffer.slice(
      bufferOrArrayBuffer.byteOffset,
      bufferOrArrayBuffer.byteOffset + bufferOrArrayBuffer.byteLength
    );
  } else if (bufferOrArrayBuffer instanceof ArrayBuffer) {
    arrayBuffer = bufferOrArrayBuffer;
  } else {
    // If it's a typed array like Uint8Array
    arrayBuffer = bufferOrArrayBuffer.buffer;
  }

  const { error } = await supabase.storage
    .from("video-assets")
    .upload(storagePath, arrayBuffer, { contentType, upsert: true });
    
  if (error) throw new Error(`Supabase buffer upload error [${storagePath}]: ${error.message}`);
  
  const { data: { publicUrl } } = supabase.storage.from("video-assets").getPublicUrl(storagePath);
  return publicUrl;
}

// Upload a local file buffer to Supabase storage, returns publicUrl
async function uploadToSupabase(localPath, storagePath, contentType) {
  const buffer = fs.readFileSync(localPath);
  return await uploadBufferToSupabase(buffer, storagePath, contentType);
}

module.exports = {
  isFonadaProvider,
  resolveSTTLanguageCode,
  getSceneCount,
  estimateDurationSeconds,
  downloadToTmp,
  uploadToSupabase,
  uploadBufferToSupabase,
};
