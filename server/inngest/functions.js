const { inngest } = require("./client");
const { supabase } = require("../config/supabase");
const { webvtt } = require("@deepgram/captions");
const axios = require("axios");

const { CohereClientV2 } = require("cohere-ai");
const cohere = new CohereClientV2({ token: process.env.COHERE_API });

// ─── Language Maps ────────────────────────────────────────────────────────────
const DEEPGRAM_TTS_MODEL_MAP = {
  en: "aura-asteria-en",
  es: "aura-asteria-es",
  fr: "aura-asteria-fr",
  de: "aura-asteria-de",
};

const LANGUAGE_NAME_TO_STT_CODE = {
  hindi: "hi",
  marathi: "mr",
  tamil: "ta",
  telugu: "te",
  gujarati: "gu",
  bengali: "bn",
  kannada: "kn",
  punjabi: "pa",
  english: "en",
  spanish: "es",
  french: "fr",
  german: "de",
  portuguese: "pt",
  japanese: "ja",
  korean: "ko",
  chinese: "zh",
};

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

// ─── Script Generation ────────────────────────────────────────────────────────
async function generateScriptForSeries(series) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 20000;
  const COHERE_MODELS = ["command-a-03-2025"];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = attempt === 1 ? COHERE_MODELS[0] : COHERE_MODELS[1];
      return await _generateScriptForSeries(series, model);
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed:`, err.message);
      const isRateLimit = err.message?.includes("429") || err.status === 429;
      if (attempt < MAX_RETRIES) {
        const delay = isRateLimit ? RETRY_DELAY_MS : 5000;
        console.warn(`⚠️ Script generation failed. Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

async function _generateScriptForSeries(series, modelName = "command-a-03-2025") {
  const { niche, duration, series_name, language_obj, voice_obj } = series;

  const sceneCount = getSceneCount(duration);
  const scriptLanguage = language_obj?.language || voice_obj?.language || "English";
  const isNonEnglish = scriptLanguage.toLowerCase() !== "english";

  const randomAngle = [
    "an inspiring personal story angle",
    "a surprising statistics-led hook",
    "a thought-provoking question opener",
    "a before-and-after transformation narrative",
    "a myth-busting approach",
    "a day-in-the-life storytelling style",
    "a challenge and triumph arc",
    "a controversial opinion opener",
  ][Math.floor(Math.random() * 8)];
  const randomSeed = Math.random().toString(36).substring(2, 8);

  console.log(`🤖 Using Cohere model: ${modelName} for ${scriptLanguage} script`);

  const systemMessage = `You are an expert ${scriptLanguage} video script writer and storyboard artist.
${isNonEnglish ? `
IMPORTANT:
1. Everything except 'imagePrompt' MUST be in ${scriptLanguage} native script.
2. Use ONLY ${scriptLanguage}'s primary script (e.g., Devanagari for Hindi/Marathi, Tamil script for Tamil).
3. 'imagePrompt' MUST ALWAYS be in English only for the image generator.
` : "All fields MUST be in clear, engaging English."}
Ensure the narrative is unique, engaging, and follows the "${randomAngle}" approach.
You MUST return the output as a valid JSON object matching this schema:
{
  "title": "string",
  "language": "string",
  "fullScript": "string",
  "scenes": [
    { "imagePrompt": "string (in English)", "narrativeText": "string (in ${scriptLanguage})" }
  ]
}
Generate exactly ${sceneCount} scenes.`;

  const prompt = `[Seed: ${randomSeed}]
Generate a UNIQUE video script for a ${niche} series titled "${series_name}".
Target Duration: ${duration} seconds.
Required Scenes: ${sceneCount}.
Video Style: ${series.video_style?.title || "cinematic"}.

Fields to generate (in ${scriptLanguage}):
- title: A catchy video title.
- fullScript: Complete narration from intro to outro.
- scenes: Exactly ${sceneCount} objects.
  - narrativeText: The specific script portion for this scene in ${scriptLanguage}.
  - imagePrompt: A detailed, cinematic description of the visual ONLY in English.`;

  const response = await cohere.chat({
    model: modelName,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ],
    responseFormat: { type: "json_object" },
    temperature: 0.8
  });

  const rawText = response.message.content[0].text;
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    console.error("❌ Cohere JSON Parse Error:");
    console.error("Raw response snippet:", rawText.slice(0, 500));
    throw new Error(`Failed to generate valid script JSON: ${err.message}`);
  }

  parsed.language = scriptLanguage;
  if (parsed.scenes.length > sceneCount) parsed.scenes = parsed.scenes.slice(0, sceneCount);

  return parsed;
}
// ─── Hello World ──────────────────────────────────────────────────────────────
const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "video-generation/hello-world" }] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return {
      message: `Hello ${event.data.name || "World"}! Video generation setup is working.`,
    };
  }
);

// ─── Main: Generate Video ─────────────────────────────────────────────────────
const generateVideo = inngest.createFunction(
  {
    id: "generate-video",
    triggers: [{ event: "video/generate" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { seriesId } = event.data;
    console.log("🔥 Inngest 'generate-video' invoked for series:", seriesId);

    // ── Step 1: Fetch series ─────────────────────────────────────────────────
    const series = await step.run(`fetch-series-data-${seriesId}`, async () => {
      const { data, error } = await supabase
        .from("video_series")
        .select("*")
        .eq("id", seriesId)
        .single();

      if (error) throw new Error(`Failed to fetch series: ${error.message}`);
      return data;
    });

    // ── Step 2: Generate script ──────────────────────────────────────────────
    const videoData = await step.run(`generate-script-${seriesId}`, async () => {
      const result = await generateScriptForSeries(series);
      console.log(`✅ Script: "${result.title}" | Lang: ${result.language} | Scenes: ${result.scenes.length}`);
      return result;
    });

    // ── Step 2.5: Create Placeholder Record ──────────────────────────────────
    const placeholder = await step.run(`create-placeholder-${seriesId}`, async () => {
      const { data, error } = await supabase
        .from("generated_videos")
        .insert({
          series_id: seriesId,
          title: videoData.title,
          status: 'generating',
          scenes: [],
          audio_url: '',
          captions_url: '',
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to create placeholder: ${error.message}`);
      return data;
    });

    // ── Step 3: Generate voiceover ───────────────────────────────────────────
    const voice = await step.run(`generate-voice-${seriesId}`, async () => {
      const { scenes } = videoData;       
      const { voice_obj, language_obj } = series;

      const isFonada = isFonadaProvider(voice_obj, language_obj);
      let finalAudioBuffer;

      if (isFonada) {
        const languageName = language_obj?.language || "Hindi";
        const voiceName = voice_obj?.modelName || "Vaanee";

        console.log(`🎙️ Fonada TTS (Chunked) → language: "${languageName}", voice: "${voiceName}"`);

        const chunkBuffers = [];
        for (let i = 0; i < scenes.length; i++) {
          const text = scenes[i].narrativeText;
          if (!text) continue;

          console.log(`Processing Scene ${i + 1} Chunk (${text.length} chars)`);

          const response = await axios({
            method: "post",
            url: "https://api.fonada.ai/tts/generate-audio-large",
            headers: {
              Authorization: `Bearer ${process.env.FONADA_API_KEY}`,
              "Content-Type": "application/json",
            },
            data: { input: text, voice: voiceName, language: languageName },
            responseType: "arraybuffer",
          });

          if (response.data && response.data.byteLength > 0) {
            chunkBuffers.push(Buffer.from(response.data));
          }
        }

        if (chunkBuffers.length === 0) throw new Error("Fonada TTS generated no audio chunks.");
        finalAudioBuffer = Buffer.concat(chunkBuffers);

      } else {
        const { fullScript } = videoData;
        const langCode = language_obj?.modelLanguageCode?.split("-")[0] || "en";
        const modelName = DEEPGRAM_TTS_MODEL_MAP[langCode] || "aura-asteria-en";

        console.log(`🎙️ Deepgram TTS → model: "${modelName}"`);

        const response = await axios({
          method: "post",
          url: `https://api.deepgram.com/v1/speak?model=${modelName}`,
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "application/json",
          },
          data: { text: fullScript },
          responseType: "arraybuffer",
        });

        if (!response.data || response.data.byteLength === 0) {
          throw new Error(`Deepgram TTS returned empty audio for model "${modelName}".`);
        }
        finalAudioBuffer = Buffer.from(response.data);
      }

      const bucketName = "video-assets";
      await supabase.storage.createBucket(bucketName, { public: true }).catch(() => { });

      const fileName = `voiceovers/${seriesId}_${Date.now()}.mp3`;
      console.log(`📤 Uploading audio to Supabase: ${fileName} (${(finalAudioBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);

      // ✅ Convert Buffer to ArrayBuffer to fix "fetch failed" in Node.js 18+
      const audioArrayBuffer = finalAudioBuffer.buffer.slice(
        finalAudioBuffer.byteOffset,
        finalAudioBuffer.byteOffset + finalAudioBuffer.byteLength
      );

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, audioArrayBuffer, { contentType: "audio/mpeg", upsert: true });

      if (uploadError) {
        console.error("❌ Supabase Audio Upload Error:", uploadError);
        throw new Error(`Supabase Audio Upload Error: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      console.log(`✅ Final Audio uploaded: ${publicUrl}`);
      return { audioUrl: publicUrl };
    });



    const captions = await step.run("generate-captions", async () => {
      const { voice_obj, language_obj } = series;

      if (isFonadaProvider(voice_obj, language_obj)) {
        console.log("⏭️ Skipping captions — Fonada provider detected.");
        return { captionsUrl: null };
      }

      const { audioUrl } = voice;
      const sttLangCode = resolveSTTLanguageCode(language_obj);
      console.log(`📝 Deepgram STT → language: "${sttLangCode}", audio: ${audioUrl}`);

      // ✅ Direct REST call - no SDK needed
      const dgResponse = await axios.post(
        "https://api.deepgram.com/v1/listen",
        { url: audioUrl },
        {
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "application/json",
          },
          params: {
            model: "nova-2",
            language: sttLangCode,
            smart_format: true,
            utterances: true,
            punctuate: true,
          },
        }
      );

      const result = dgResponse.data;

      if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
        throw new Error(`Deepgram STT returned empty result. Language: "${sttLangCode}", URL: ${audioUrl}`);
      }

      const vttContent = webvtt(result);
      const bucketName = "video-assets";
      const fileName = `captions/${seriesId}_${Date.now()}.vtt`;
      console.log(`📤 Uploading captions to Supabase: ${fileName}`);

      // ✅ Convert string/Buffer to ArrayBuffer to fix "fetch failed"
      const vttBuffer = Buffer.from(vttContent);
      const vttArrayBuffer = vttBuffer.buffer.slice(
        vttBuffer.byteOffset,
        vttBuffer.byteOffset + vttBuffer.byteLength
      );

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, vttArrayBuffer, { contentType: "text/vtt", upsert: true });

      if (uploadError) {
        console.error("❌ Supabase VTT Upload Error:", uploadError);
        throw new Error(`Supabase VTT Upload Error: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      console.log(`✅ Captions uploaded: ${publicUrl}`);
      return { captionsUrl: publicUrl };
    });



    // ── Step 5: Generate images individually (Restart-proof) ─────────
    const { scenes } = videoData;
    const { series_name, niche, video_style } = series;
    const styleTitle = video_style?.title || "cinematic";
    const generatedScenes = [];

    // A simple seed for consistency across the series
    const seed = Math.floor(Math.random() * 1000000);

    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const sceneWithImage = await step.run(`generate-scene-${i + 1}-image`, async () => {
            console.log(`🎨 Generating Image for Scene ${i + 1}/${scenes.length}...`);
            const prompt = `Series: ${series_name}. Niche: ${niche}. Style: ${styleTitle}. Scene Description: ${scene.imagePrompt}`;

            const hfRes = await axios.post(
                "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
                { 
                    inputs: prompt,
                    parameters: { width: 1024, height: 1024, seed: seed }
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                        "Content-Type": "application/json",
                        Accept: "image/jpeg",
                    },
                    responseType: "arraybuffer",
                }
            );

            if (!hfRes.data || hfRes.data.byteLength === 0) {
                throw new Error(`Hugging Face Inference API returned empty buffer for scene ${i + 1}`);
            }

            const imgBuffer = Buffer.from(hfRes.data);
            const bucketName = "video-assets";
            const fileName = `images/${seriesId}_scene_${i + 1}_${Date.now()}.png`;

            // ✅ Convert Buffer to ArrayBuffer to fix "fetch failed" in Node.js 18+
            const imgArrayBuffer = imgBuffer.buffer.slice(
                imgBuffer.byteOffset,
                imgBuffer.byteOffset + imgBuffer.byteLength
            );

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, imgArrayBuffer, { contentType: "image/png", upsert: true });

            if (uploadError) throw new Error(`Supabase Image Upload Error for scene ${i + 1}: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
            console.log(`✅ Scene ${i + 1} Image: ${publicUrl}`);

            return {
                ...scene,
                imageUrl: publicUrl
            };
        });
        generatedScenes.push(sceneWithImage);
    }

    // ── Step 6: Finalize Database Record ─────────────────────────────────────
    const savedResult = await step.run("finalize-database-record", async () => {
      console.log(`💾 Finalizing results for ${generatedScenes.length} scenes to 'generated_videos'...`);

      const { data, error } = await supabase
        .from("generated_videos")
        .update({
          audio_url: voice.audioUrl,
          captions_url: captions.captionsUrl,
          scenes: generatedScenes,
          status: 'completed'
        })
        .eq("id", placeholder.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to finalize video result:", error.message);
        throw new Error(`DB Finalize Error: ${error.message}`);
      }
      console.log(`✅ Generation complete! Video ID: ${placeholder.id}`);

      return data;
    });

    return {
      success: true,
      message: `Video generation completed for: ${series.series_name}`,
      data: {
        id: savedResult.id,
        title: videoData.title,
        language: videoData.language,
        scenesCount: generatedScenes.length,
        audioUrl: voice.audioUrl,
        captionsUrl: captions.captionsUrl,
        imageUrls: generatedScenes.map((s) => s.imageUrl),
        scenes: generatedScenes,
      },
    };
  }
);

module.exports = [helloWorld, generateVideo];