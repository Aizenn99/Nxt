const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { CohereClientV2 } = require("cohere-ai");
const { supabase } = require("../../config/supabase");
const { FORMAT_CONFIG, NICHE_TONE_MAP } = require("./constants");
const { estimateDurationSeconds, uploadToSupabase } = require("./utils");

const cohere = new CohereClientV2({ token: process.env.COHERE_API });

// ─── Image Generation with Fallback Chain ─────────────────────────────────────
async function generateImageWithFallback(prompt, seed, format = "landscape") {
  const { falSize, width, height } = FORMAT_CONFIG[format] || FORMAT_CONFIG.landscape;

  // 1st: Fal.ai Flux Schnell
  try {
    const falRes = await axios.post(
      "https://fal.run/fal-ai/flux/schnell",
      {
        prompt,
        image_size: falSize,
        num_inference_steps: 4,
        num_images: 1,
        seed,
      },
      {
        headers: {
          Authorization: `Key ${process.env.FAL_AI}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );
    const url = falRes.data?.images?.[0]?.url;
    if (url) {
      console.log("✅ Image from Fal.ai Flux");
      return url;
    }
    throw new Error("Fal.ai returned no image URL");
  } catch (err) {
    console.warn("⚠️ Fal.ai failed, falling back to Pollinations:", err.message);
  }

  // 2nd: Pollinations.ai fallback
  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
  console.log("✅ Image from Pollinations.ai");
  return pollinationsUrl;
}

// ─── Thumbnail Generator ──────────────────────────────────────────────────────
async function generateThumbnail(firstImageUrl, title, seriesId) {
  try {
    const imgRes = await axios.get(firstImageUrl, { responseType: "arraybuffer" });

    const safeTitle = title.substring(0, 40).replace(/[<>&"]/g, "");
    const svgOverlay = Buffer.from(`
      <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0.75)"/>
          </linearGradient>
        </defs>
        <rect x="0" y="400" width="1280" height="320" fill="url(#grad)"/>
        <text
          x="64" y="650"
          font-family="Arial Black, Arial, sans-serif"
          font-size="52"
          font-weight="900"
          fill="white"
          stroke="black"
          stroke-width="2"
        >${safeTitle}</text>
      </svg>
    `);

    const thumbnailBuffer = await sharp(Buffer.from(imgRes.data))
      .resize(1280, 720, { fit: "cover" })
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toBuffer();

    const fileName = `thumbnails/${seriesId}_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("video-assets")
      .upload(fileName, thumbnailBuffer, { contentType: "image/jpeg", upsert: true });

    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from("video-assets").getPublicUrl(fileName);
    console.log(`🖼️ Thumbnail generated: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.warn("⚠️ Thumbnail generation failed (non-critical):", err.message);
    return null;
  }
}

// ─── FFmpeg MP4 Renderer ──────────────────────────────────────────────────────
async function renderMP4(scenes, audioUrl, seriesId, format = "landscape") {
  const { ffmpegScale } = FORMAT_CONFIG[format] || FORMAT_CONFIG.landscape;
  const tmpDir = `/tmp/${seriesId}_render`;
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // Download audio
  const audioPath = path.join(tmpDir, "audio.mp3");
  const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer" });
  fs.writeFileSync(audioPath, Buffer.from(audioRes.data));

  // Download all scene images
  const imagePaths = await Promise.all(
    scenes.map(async (scene, i) => {
      const imgPath = path.join(tmpDir, `scene_${i}.jpg`);
      try {
        const imgRes = await axios.get(scene.imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, Buffer.from(imgRes.data));
      } catch {
        // If image download fails, create a black frame placeholder
        await sharp({
          create: { width: 1344, height: 768, channels: 3, background: { r: 0, g: 0, b: 0 } }
        }).jpeg().toFile(imgPath);
      }
      return imgPath;
    })
  );

  // Calculate per-scene duration
  const totalEstimated = scenes.reduce(
    (sum, s) => sum + (s.estimatedDuration || estimateDurationSeconds(s.narrativeText)),
    0
  );
  const perSceneDuration = totalEstimated / scenes.length;

  // Build FFmpeg concat file
  const concatFilePath = path.join(tmpDir, "concat.txt");
  const concatContent = imagePaths
    .map(p => `file '${p}'\nduration ${perSceneDuration.toFixed(2)}`)
    .join("\n");
  fs.writeFileSync(concatFilePath, concatContent);

  const outputPath = path.join(tmpDir, "output.mp4");

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatFilePath)
      .inputOptions(["-f concat", "-safe 0"])
      .input(audioPath)
      .outputOptions([
        `-vf scale=${ffmpegScale}:force_original_aspect_ratio=decrease,pad=${ffmpegScale.replace(":", ":")}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
        "-c:v libx264",
        "-preset fast",
        "-crf 23",
        "-c:a aac",
        "-b:a 128k",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        "-shortest",
      ])
      .output(outputPath)
      .on("start", cmd => console.log("🎬 FFmpeg started:", cmd))
      .on("progress", p => console.log(`🎬 FFmpeg progress: ${Math.round(p.percent || 0)}%`))
      .on("end", () => resolve(outputPath))
      .on("error", err => reject(new Error(`FFmpeg render failed: ${err.message}`)))
      .run();
  });
}

// ─── Social Metadata Generator ────────────────────────────────────────────────
async function generateSocialMetadata(videoData, niche) {
  try {
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [{
        role: "user",
        content: `Based on this video for the "${niche}" niche:
Title: ${videoData.title}
Script excerpt: ${videoData.fullScript?.substring(0, 400) || ""}

Generate a JSON object with these fields:
- youtubeDescription: string, 120-150 word SEO-optimised YouTube description
- hashtags: array of 15 relevant hashtags (no # prefix)
- instagramCaption: string, punchy 50-word Instagram caption with emojis
- twitterPost: string, under 280 characters, engaging tweet

Return ONLY valid JSON, no markdown, no preamble.`,
      }],
      responseFormat: { type: "json_object" },
      temperature: 0.7,
    });

    const raw = response.message.content[0].text;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("⚠️ Social metadata generation failed (non-critical):", err.message);
    return null;
  }
}

// ─── Script Generation Internal ──────────────────────────────────────────────
async function _generateScriptForSeries(series, modelName) {
  const { series_name, niche, duration, language_obj, voice_obj } = series;
  const sceneCount = series.sceneCount || 4; // Default if not provided
  const scriptLanguage = language_obj?.language || voice_obj?.language || "English";
  const isNonEnglish = scriptLanguage.toLowerCase() !== "english";

  const tone = NICHE_TONE_MAP[niche?.toLowerCase()] || "engaging, clear, professional";

  const randomAngle = [
    "an inspiring personal story angle",
    "a surprising statistics-led hook",
    "a tutorial-style step-by-step angle",
    "a motivational call-to-action lens",
    "a historical perspective",
    "a 'day in the life' narrative",
    "a challenge and triumph arc",
    "a controversial opinion opener",
  ][Math.floor(Math.random() * 8)];

  const randomSeed = Math.random().toString(36).substring(2, 8);

  console.log(`🤖 Cohere model: ${modelName} | Language: ${scriptLanguage} | Tone: ${tone}`);

  const systemMessage = `You are an expert ${scriptLanguage} video script writer and storyboard artist.
${isNonEnglish ? `
IMPORTANT LANGUAGE RULES:
1. Everything except 'imagePrompt' MUST be in ${scriptLanguage} native script.
2. Use ONLY ${scriptLanguage}'s primary script (e.g., Devanagari for Hindi/Marathi, Tamil script for Tamil).
3. 'imagePrompt' MUST ALWAYS be in English only — it feeds an image generation model.
` : "All fields MUST be in clear, engaging English."}

Tone: ${tone}
Narrative approach: "${randomAngle}"

Return ONLY a valid JSON object matching this exact schema — no markdown, no preamble:
{
  "title": "string — catchy video title in ${scriptLanguage}",
  "language": "string",
  "hook": "string — one powerful opening line in ${scriptLanguage}, spoken in the first 3 seconds",
  "cta": "string — closing call-to-action line in ${scriptLanguage}",
  "scenes": [
    {
      "imagePrompt": "string — detailed cinematic visual description IN ENGLISH ONLY",
      "narrativeText": "string — 2-3 sentences (~15-25 words) in ${scriptLanguage}, designed for 5-8 seconds of speech"
    }
  ]
}

Generate exactly ${sceneCount} scenes.
The sum of all narrativeText should fill approximately ${duration} seconds when spoken aloud.
Each scene narrativeText must be self-contained and flow naturally into the next.`;

  const prompt = `[Seed: ${randomSeed}]
Generate a UNIQUE video script for the "${niche}" niche, series titled: "${series_name}".
Target Duration: ${duration} seconds.
Required Scenes: ${sceneCount}.
Video Style: ${series.video_style?.title || "cinematic"}.
Tone: ${tone}.`;

  const response = await cohere.chat({
    model: modelName,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ],
    responseFormat: { type: "json_object" },
    temperature: 0.8,
  });

  const rawText = response.message.content[0].text;
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    console.error("❌ Cohere JSON parse error. Snippet:", rawText.slice(0, 500));
    throw new Error(`Failed to parse script JSON: ${err.message}`);
  }

  parsed.language = scriptLanguage;

  parsed.fullScript = [
    parsed.hook || "",
    ...parsed.scenes.map(s => s.narrativeText),
    parsed.cta || "",
  ]
    .filter(Boolean)
    .join("  ");

  return parsed;
}

module.exports = {
  generateImageWithFallback,
  generateThumbnail,
  renderMP4,
  generateSocialMetadata,
  _generateScriptForSeries,
};
