const axios = require("axios");
const fs = require("fs");
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
  // Ensure /tmp/ exists (for platforms that might not have it pre-created)
  if (!fs.existsSync("/tmp")) fs.mkdirSync("/tmp", { recursive: true });
  
  const tmpPath = `/tmp/${Date.now()}_${suffix}`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(tmpPath, Buffer.from(res.data));
  return tmpPath;
}

// Upload a local file buffer to Supabase storage, returns publicUrl
async function uploadToSupabase(localPath, storagePath, contentType) {
  const buffer = fs.readFileSync(localPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  
  const { error } = await supabase.storage
    .from("video-assets")
    .upload(storagePath, arrayBuffer, { contentType, upsert: true });
    
  if (error) throw new Error(`Supabase upload error [${storagePath}]: ${error.message}`);
  
  const { data: { publicUrl } } = supabase.storage.from("video-assets").getPublicUrl(storagePath);
  return publicUrl;
}

module.exports = {
  isFonadaProvider,
  resolveSTTLanguageCode,
  getSceneCount,
  estimateDurationSeconds,
  downloadToTmp,
  uploadToSupabase,
};
