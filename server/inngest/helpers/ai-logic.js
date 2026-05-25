const axios = require("axios");
const ffmpegStatic = require("ffmpeg-static");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const sharp = require("sharp");
const { CohereClientV2 } = require("cohere-ai");
const { supabase } = require("../../config/supabase");
const { FORMAT_CONFIG, NICHE_TONE_MAP } = require("./constants");
const { estimateDurationSeconds, uploadToSupabase, uploadBufferToSupabase } = require("./utils");

const cohere = new CohereClientV2({ token: process.env.COHERE_API });

// ─── Image Generation with Fallback Chain ─────────────────────────────────────
async function generateImageWithFallback(prompt, seed, format = "landscape") {
  // 1st: Hugging Face (FLUX.1-schnell)
  try {
    const hfRes = await axios.post(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "image/jpeg",
        },
        responseType: "arraybuffer",
        timeout: 60000,
      }
    );

    if (hfRes.status === 200 && hfRes.data) {
      // Normalize to valid JPEG using Sharp
      const normalizedBuffer = await sharp(Buffer.from(hfRes.data)).jpeg().toBuffer();
      const fileName = `images/hf_${Date.now()}.jpg`;
      const hfUrl = await uploadBufferToSupabase(normalizedBuffer, fileName, "image/jpeg");
      console.log("✅ Image from Hugging Face");
      return hfUrl;
    }
    throw new Error(`Hugging Face API returned status ${hfRes.status}`);
  } catch (err) {
    console.warn("⚠️ Hugging Face failed, falling back to Pollinations:", err.message);
  }

  // 2nd: Pollinations.ai (Reliable zero-config fallback)
  try {
    const safePrompt = encodeURIComponent(prompt.substring(0, 1000));
    const polUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
    
    const polRes = await axios.get(polUrl, { responseType: "arraybuffer", timeout: 60000, maxRedirects: 5 });
    if (polRes.status === 200 && polRes.data && polRes.data.byteLength > 1000) {
      // Normalize to valid JPEG using Sharp
      const normalizedBuffer = await sharp(Buffer.from(polRes.data)).jpeg({ quality: 90 }).toBuffer();
      const fileName = `images/pol_${Date.now()}.jpg`;
      const publicUrl = await uploadBufferToSupabase(normalizedBuffer, fileName, "image/jpeg");
      console.log("✅ Image from Pollinations");
      return publicUrl;
    }
    throw new Error(`Pollinations returned status ${polRes.status} or empty data (${polRes.data?.byteLength || 0} bytes)`);
  } catch (err) {
    console.error("❌ Pollinations fallback failed:", err.message);
  }

  return null;
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
    const thumbnailUrl = await uploadBufferToSupabase(thumbnailBuffer, fileName, "image/jpeg");
    console.log(`🖼️ Thumbnail generated: ${thumbnailUrl}`);
    return thumbnailUrl;
  } catch (err) {
    console.warn("⚠️ Thumbnail generation failed (non-critical):", err.message);
    return null;
  }
}

// ─── Caption Style Map ────────────────────────────────────────────────────────
// Maps each caption style ID to a unique FFmpeg ASS force_style string.
// Colors are in ASS &HBBGGRR format (Blue-Green-Red, no alpha).
const CAPTION_STYLE_MAP = {
  karaoke:
    "FontName=Arial Black,FontSize=28,PrimaryColour=&Hffffff,SecondaryColour=&H00ffff," +
    "OutlineColour=&H000000,BackColour=&H80000000,Bold=1,BorderStyle=3,Outline=2,Shadow=1,Alignment=2,MarginV=25",
  typewriter:
    "FontName=Courier New,FontSize=22,PrimaryColour=&H00ff00," +
    "OutlineColour=&H003300,BackColour=&HC0000000,Bold=1,BorderStyle=3,Outline=1,Shadow=0,Alignment=2,MarginV=30",
  pop:
    "FontName=Impact,FontSize=36,PrimaryColour=&Hffffff," +
    "OutlineColour=&Hff00ff,BackColour=&H00000000,Bold=1,BorderStyle=1,Outline=3,Shadow=2,Alignment=2,MarginV=20",
  slide:
    "FontName=Trebuchet MS,FontSize=24,PrimaryColour=&Hffffff," +
    "OutlineColour=&H404040,BackColour=&H00000000,Bold=0,BorderStyle=1,Outline=2,Shadow=3,Alignment=2,MarginV=45",
  glow:
    "FontName=Arial,FontSize=28,PrimaryColour=&Hffffff," +
    "OutlineColour=&H0088ff,BackColour=&H00000000,Bold=1,BorderStyle=1,Outline=4,Shadow=0,Alignment=2,MarginV=25",
  shake:
    "FontName=Impact,FontSize=34,PrimaryColour=&H00ffff," +
    "OutlineColour=&H000000,BackColour=&H00000000,Bold=1,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=20",
};

// ─── Ken Burns Effects ────────────────────────────────────────────────────────
// Each function returns a zoompan filter string.
// Images are resized to 2x output to give room for zoom/pan.
// z range 1.3-1.8 keeps image sharp throughout (on a 2x source).
const KEN_BURNS_EFFECTS = [
  // 1. Slow zoom in, centered
  (d, w, h) =>
    `zoompan=z='1.3+on*0.5/${d}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=25`,
  // 2. Slow zoom out, centered
  (d, w, h) =>
    `zoompan=z='1.8-on*0.5/${d}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=25`,
  // 3. Pan left → right at moderate zoom
  (d, w, h) =>
    `zoompan=z='1.5':x='on*(iw-iw/zoom)/${d}':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=25`,
  // 4. Pan right → left at moderate zoom
  (d, w, h) =>
    `zoompan=z='1.5':x='(iw-iw/zoom)-on*(iw-iw/zoom)/${d}':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=25`,
  // 5. Zoom in + pan right
  (d, w, h) =>
    `zoompan=z='1.3+on*0.4/${d}':x='on*(iw-iw/zoom)/${d}':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=25`,
  // 6. Zoom out + pan down
  (d, w, h) =>
    `zoompan=z='1.8-on*0.4/${d}':x='iw/2-(iw/zoom/2)':y='on*(ih-ih/zoom)/${d}':d=${d}:s=${w}x${h}:fps=25`,
];

// ─── FFmpeg Spawn Helper ──────────────────────────────────────────────────────
function runFFmpegSpawn(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegStatic, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderrLog = "";

    proc.stderr.on("data", (chunk) => {
      const line = chunk.toString();
      stderrLog += line;
      const timeMatch = line.match(/time=(\d+:\d+:\d+\.\d+)/);
      if (timeMatch) {
        console.log(`🎬 FFmpeg progress: ${timeMatch[1]}`);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error("🎬 FFmpeg stderr (last 1500 chars):", stderrLog.slice(-1500));
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    proc.on("error", (err) =>
      reject(new Error(`FFmpeg spawn error: ${err.message}`))
    );
  });
}

// ─── FFmpeg MP4 Renderer (Ken Burns + Caption Styles) ─────────────────────────
async function renderMP4(scenes, audioUrl, seriesId, format = "landscape", captionsUrl = null, captionStyle = null) {
  const config = FORMAT_CONFIG[format] || FORMAT_CONFIG.landscape;
  const { ffmpegScale } = config;
  const [scaleW, scaleH] = ffmpegScale.split(":");
  const fps = 25;

  // ── Temp directory setup
  const baseTmp = path.resolve(os.tmpdir(), "nxtai");
  if (!fs.existsSync(baseTmp)) fs.mkdirSync(baseTmp, { recursive: true });
  const tmpDir = path.join(baseTmp, `${seriesId}_render`);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // ── Download audio
  const audioPath = path.join(tmpDir, "audio.mp3");
  const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer" });
  fs.writeFileSync(audioPath, Buffer.from(audioRes.data));

  // ── Download captions VTT
  let captionsPath = null;
  if (captionsUrl) {
    try {
      captionsPath = path.join(tmpDir, "captions.vtt");
      const capRes = await axios.get(captionsUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(captionsPath, Buffer.from(capRes.data));
      console.log("📝 Captions downloaded for burning into video");
    } catch (err) {
      console.warn("⚠️ Could not download captions:", err.message);
      captionsPath = null;
    }
  }

  // ── Download images & resize to 2x output for zoompan headroom
  const srcW = parseInt(scaleW) * 2;
  const srcH = parseInt(scaleH) * 2;
  const imagePaths = await Promise.all(
    scenes.map(async (scene, i) => {
      const imgPath = path.join(tmpDir, `scene_${i}.jpg`);
      try {
        if (!scene.imageUrl) throw new Error("No imageUrl");
        const imgRes = await axios.get(scene.imageUrl, { responseType: "arraybuffer" });
        const normalizedBuf = await sharp(Buffer.from(imgRes.data))
          .resize(srcW, srcH, { fit: "cover" })
          .jpeg({ quality: 95 })
          .toBuffer();
        fs.writeFileSync(imgPath, normalizedBuf);
      } catch {
        await sharp({
          create: { width: srcW, height: srcH, channels: 3, background: { r: 0, g: 0, b: 0 } },
        })
          .jpeg()
          .toFile(imgPath);
      }
      return imgPath;
    })
  );

  // ── Calculate per-scene duration
  const totalEstimated = scenes.reduce(
    (sum, s) => sum + (s.estimatedDuration || estimateDurationSeconds(s.narrativeText)),
    0
  );
  const perSceneDuration = Math.max(totalEstimated / scenes.length, 3);
  console.log(`🎬 Per-scene duration: ${perSceneDuration.toFixed(2)}s (${scenes.length} scenes, ${totalEstimated.toFixed(1)}s total)`);

  // ── Pass 1: Render each scene with a Ken Burns zoom/pan effect
  const sceneClips = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const clipPath = path.join(tmpDir, `clip_${i}.mp4`);
    const totalFrames = Math.ceil(perSceneDuration * fps);
    const effectFn = KEN_BURNS_EFFECTS[i % KEN_BURNS_EFFECTS.length];
    const zoompanFilter = effectFn(totalFrames, scaleW, scaleH);

    await runFFmpegSpawn([
      "-loop", "1",
      "-i", imagePaths[i],
      "-vf", zoompanFilter,
      "-t", perSceneDuration.toFixed(2),
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-y", clipPath,
    ]);

    sceneClips.push(clipPath);
    console.log(`🎬 Scene ${i + 1}/${imagePaths.length} rendered with Ken Burns effect`);
  }

  // ── Create concat manifest for the clips
  const concatFilePath = path.join(tmpDir, "concat.txt");
  const concatLines = sceneClips.map((p) => `file '${p.replace(/\\/g, "/")}'`);
  fs.writeFileSync(concatFilePath, concatLines.join("\n"));

  const outputPath = path.join(tmpDir, "output.mp4");

  // ── Resolve caption force_style from series captionStyle
  const styleId = captionStyle?.id || "karaoke";
  const forceStyle = CAPTION_STYLE_MAP[styleId] || CAPTION_STYLE_MAP.karaoke;
  console.log(`🎨 Caption style: "${styleId}"`);

  // ── Pass 2: Concatenate clips + audio + subtitles
  function buildFinalArgs(withSubtitles) {
    const args = [
      "-f", "concat", "-safe", "0", "-i", concatFilePath,
      "-i", audioPath,
    ];

    if (withSubtitles && captionsPath) {
      const escapedPath = captionsPath.replace(/\\/g, "/").replace(/:/g, "\\:");
      args.push("-vf", `subtitles='${escapedPath}':force_style='${forceStyle}'`);
    }

    args.push(
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "128k",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-shortest",
      "-y", outputPath
    );
    return args;
  }

  // Try with subtitles first, fallback to without
  try {
    console.log("🎬 Final render (with subtitles)...");
    await runFFmpegSpawn(buildFinalArgs(true));
    return outputPath;
  } catch (err) {
    if (captionsPath) {
      console.warn("⚠️ Final render failed with subtitles, retrying without:", err.message);
      await runFFmpegSpawn(buildFinalArgs(false));
      return outputPath;
    }
    throw err;
  }
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
