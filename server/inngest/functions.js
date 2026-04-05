const { inngest } = require("./client");
const { supabase } = require("../config/supabase");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { DeepgramClient } = require("@deepgram/sdk");
const { webvtt } = require("@deepgram/captions");
const axios = require("axios");

// ─── Clients ──────────────────────────────────────────────────────────────────
const deepgram = new DeepgramClient(process.env.DEEPGRAM_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

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

// ─── Gemini Response Schema ───────────────────────────────────────────────────
function buildResponseSchema(sceneCount) {
  return {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: "Video title written ONLY in the target language native script",
      },
      language: {
        type: SchemaType.STRING,
        description: "The target language name e.g. Hindi, Tamil",
      },
      fullScript: {
        type: SchemaType.STRING,
        description: "Complete narration written ONLY in the target language native script",
      },
      scenes: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            imagePrompt: {
              type: SchemaType.STRING,
              description: "MUST be in English only. Detailed cinematic description for AI image generation.",
            },
            narrativeText: {
              type: SchemaType.STRING,
              description: "MUST be written ONLY in the target language native script. Never English.",
            },
          },
          required: ["imagePrompt", "narrativeText"],
        },
        minItems: sceneCount,
        maxItems: sceneCount,
      },
    },
    required: ["title", "language", "fullScript", "scenes"],
  };
}

// ─── Script Generation: Single-step JSON schema generation ────────────────────
async function generateScriptForSeries(series) {
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

  // Consolidated Single Call to save Gemini Quota (Free tier is only 15-20 req/day)
  const jsonModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 1.2,
      topP: 0.9,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(sceneCount),
    },
    systemInstruction: `You are an expert ${scriptLanguage} video script writer and storyboard artist.
${isNonEnglish ? `
IMPORTANT:
1. Everything except 'imagePrompt' MUST be in ${scriptLanguage} native script.
2. Use ONLY ${scriptLanguage}'s primary script (e.g., Devanagari for Hindi/Marathi, Tamil script for Tamil).
3. 'imagePrompt' MUST ALWAYS be in English only for the image generator.
` : "All fields MUST be in clear, engaging English."}
Ensure the narrative is unique, engaging, and follows the "${randomAngle}" approach.`,
  });

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

  const result = await jsonModel.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());
  
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
    const series = await step.run("fetch-series-data", async () => {
      const { data, error } = await supabase
        .from("video_series")
        .select("*")
        .eq("id", seriesId)
        .single();

      if (error) throw new Error(`Failed to fetch series: ${error.message}`);
      return data;
    });

    // ── Step 2: Generate script ──────────────────────────────────────────────
    const videoData = await step.run("generate-script", async () => {
      const result = await generateScriptForSeries(series);
      console.log(`✅ Script: "${result.title}" | Lang: ${result.language} | Scenes: ${result.scenes.length}`);
      return result;
    });

    // ── Step 3: Generate voiceover ───────────────────────────────────────────
    const voice = await step.run("generate-voice", async () => {
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
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, finalAudioBuffer, { contentType: "audio/mpeg", upsert: true });

      if (uploadError) throw new Error(`Supabase Audio Upload Error: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      console.log(`✅ Final Audio uploaded: ${publicUrl}`);
      return { audioUrl: publicUrl };
    });

    // ── Step 4: Generate captions ───────────────────────────────────────────
    const captions = await step.run("generate-captions", async () => {
      const { voice_obj, language_obj } = series;

      if (isFonadaProvider(voice_obj, language_obj)) {
        console.log("⏭️ Skipping captions — Fonada provider detected.");
        return { captionsUrl: null };
      }

      const { audioUrl } = voice;
      const sttLangCode = resolveSTTLanguageCode(language_obj);
      console.log(`📝 Deepgram STT → language: "${sttLangCode}", audio: ${audioUrl}`);

      const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        {
          model: "nova-2",
          language: sttLangCode,
          smart_format: true,
          utterances: true,
          punctuate: true,
        }
      );

      if (error) throw new Error(`Deepgram STT error: ${error.message}`);
      if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
        throw new Error(`Deepgram STT empty. Language: "${sttLangCode}", URL: ${audioUrl}.`);
      }

      const vttContent = webvtt(result);
      const bucketName = "video-assets";
      const fileName = `captions/${seriesId}_${Date.now()}.vtt`;
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, vttContent, { contentType: "text/vtt", upsert: true });

      if (uploadError) throw new Error(`Supabase VTT Upload Error: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      console.log(`✅ Captions uploaded: ${publicUrl}`);
      return { captionsUrl: publicUrl };
    });

    // ── Step 5: Generate images ───────────────────────────────────────
    const images = await step.run("generate-images", async () => {
      console.warn("⚠️ generate-images: placeholder.");
      return { imageUrls: [] };
    });

    // ── Step 6: Save to database ──────────────────────────────────────
    await step.run("save-to-database", async () => {
      console.warn("⚠️ save-to-database: placeholder.");
      return { success: true };
    });

    return {
      success: true,
      message: `Video generation completed for: ${series.series_name}`,
      data: {
        title: videoData.title,
        language: videoData.language,
        scenes: videoData.scenes.length,
        audioUrl: voice.audioUrl,
        captionsUrl: captions.captionsUrl,
        imageUrls: images.imageUrls,
      },
    };
  }
);

module.exports = [helloWorld, generateVideo];