const { inngest } = require("./client");
const { supabase } = require("../config/supabase");
const { webvtt } = require("@deepgram/captions");
const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Models & Services
const User = require("../models/user");
const { sendVideoReadyEmail } = require("../utils/emailService");

// Helper modules
const {
  DEEPGRAM_TTS_MODEL_MAP,
  COHERE_MODELS,
} = require("./helpers/constants");

const {
  isFonadaProvider,
  resolveSTTLanguageCode,
  estimateDurationSeconds,
  uploadToSupabase,
  uploadBufferToSupabase,
} = require("./helpers/utils");

const {
  generateImageWithFallback,
  generateThumbnail,
  renderMP4,
  generateSocialMetadata,
  _generateScriptForSeries,
} = require("./helpers/ai-logic");

// ─── Script Generation Wrapper ──────────────────────────────────────────────
async function generateScriptForSeries(series) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 20000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = attempt === 1 ? COHERE_MODELS[0] : COHERE_MODELS[1];
      return await _generateScriptForSeries(series, model);
    } catch (err) {
      console.error(`❌ Script attempt ${attempt} failed:`, err.message);
      const isRateLimit = err.message?.includes("429") || err.status === 429;
      if (attempt < MAX_RETRIES) {
        const delay = isRateLimit ? RETRY_DELAY_MS : 5000;
        console.warn(`⚠️ Retrying script generation in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

// ─── Hello World ──────────────────────────────────────────────────────────────
const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "video-generation/hello-world" }] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.name || "World"}!` };
  }
);

// ─── Main Video Generation Pipeline ──────────────────────────────────────────
const generateVideo = inngest.createFunction(
  {
    id: "generate-video",
    triggers: [{ event: "video/generate" }],
    concurrency: { limit: 1, key: "event.data.seriesId" }, // Limit per series to prevent overlaps
  },
  async ({ event, step }) => {
    const { seriesId } = event.data;
    const format = event.data.format || "landscape";
    const skipImages = event.data.skipImages || false;
    console.log(`🔥 Inngest 'generate-video' invoked | series: ${seriesId} | format: ${format} | skipImages: ${skipImages}`);

    // ── Step 1: Fetch series
    const series = await step.run(`fetch-series-data-${seriesId}`, async () => {
      const { data, error } = await supabase
        .from("video_series")
        .select("*")
        .eq("id", seriesId)
        .single();
      if (error) throw new Error(`Failed to fetch series: ${error.message}`);
      return data;
    });

    // ── Step 2: Create placeholder record (Track from start)
    const placeholder = await step.run(`create-placeholder-${seriesId}`, async () => {
      const { data, error } = await supabase
        .from("generated_videos")
        .insert({
          series_id: seriesId,
          title: "Preparing script...",
          status: "generating",
          scenes: [],
          format,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Failed to create placeholder: ${error.message}`);
      return data;
    });

    try {
      // ── Step 3: Generate script
      const videoData = await step.run(`generate-script-${seriesId}`, async () => {
        const result = await generateScriptForSeries(series);
        // Update title now that we have it
        await supabase
          .from("generated_videos")
          .update({ title: result.title })
          .eq("id", placeholder.id);
        return result;
      });
      // ── Step 3: Generate voiceover
      const voice = await step.run(`generate-voice-${seriesId}`, async () => {
        const { scenes } = videoData;
        const { voice_obj, language_obj } = series;
        const isFonada = isFonadaProvider(voice_obj, language_obj);
        let finalAudioBuffer;

        if (isFonada) {
          const languageName = language_obj?.language || "Hindi";
          const voiceName = voice_obj?.modelName || "Vaanee";
          console.log(`🎙️ Fonada TTS | language: "${languageName}" | voice: "${voiceName}"`);

          const chunkBuffers = [];
          for (let i = 0; i < scenes.length; i++) {
            const text = scenes[i].narrativeText;
            if (!text) continue;
            console.log(`  Chunk ${i + 1}/${scenes.length} (${text.length} chars)`);

            const response = await axios({
              method: "post",
              url: "https://api.fonada.com/v1/tts",
              headers: {
                "x-api-key": process.env.FONADA_API_KEY,
                "Content-Type": "application/json",
              },
              data: {
                text,
                language: languageName,
                voice: voiceName,
                speed: 1.0,
              },
              responseType: "arraybuffer",
            });

            if (response.data?.byteLength > 0) {
              chunkBuffers.push(Buffer.from(response.data));
              // Silence gap
              chunkBuffers.push(Buffer.alloc(8000, 0));
            }
          }
          finalAudioBuffer = Buffer.concat(chunkBuffers);

        } else {
          const langCode = language_obj?.modelLanguageCode?.split("-")[0] || "en";
          const modelName = DEEPGRAM_TTS_MODEL_MAP[langCode];

          if (!modelName) {
            throw new Error(`No Deepgram TTS model for code "${langCode}".`);
          }

          console.log(`🎙️ Deepgram TTS | model: "${modelName}"`);
          const response = await axios({
            method: "post",
            url: `https://api.deepgram.com/v1/speak?model=${modelName}`,
            headers: {
              Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
              "Content-Type": "application/json",
            },
            data: {
              text: videoData.scenes.map(s => s.narrativeText).join("\n\n"),
            },
            responseType: "arraybuffer",
          });

          if (!response.data || response.data.byteLength === 0) {
            throw new Error("Deepgram TTS returned empty buffer");
          }
          finalAudioBuffer = Buffer.from(response.data);
        }

        await supabase.storage.createBucket("video-assets", { public: true }).catch(() => { });
        const fileName = `voiceovers/${seriesId}_${Date.now()}.mp3`;
        console.log(`📤 Uploading audio (${(finalAudioBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);

        const audioArrayBuffer = finalAudioBuffer.buffer.slice(
          finalAudioBuffer.byteOffset,
          finalAudioBuffer.byteOffset + finalAudioBuffer.byteLength
        );

        const { error: uploadError } = await supabase.storage
          .from("video-assets")
          .upload(fileName, audioArrayBuffer, { contentType: "audio/mpeg", upsert: true });

        if (uploadError) throw new Error(`Audio Upload Error: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from("video-assets").getPublicUrl(fileName);
        console.log(`✅ Audio uploaded: ${publicUrl}`);
        return { audioUrl: publicUrl };
      });

      // ── Step 4: Generate captions
      const captions = await step.run("generate-captions", async () => {
        const { voice_obj, language_obj } = series;
        if (isFonadaProvider(voice_obj, language_obj)) {
          console.log("⏭️ Skipping captions — Fonada provider.");
          return { captionsUrl: null };
        }

        const sttLangCode = resolveSTTLanguageCode(language_obj);
        console.log(`📝 Deepgram STT | language: "${sttLangCode}"`);

        const dgResponse = await axios.post(
          "https://api.deepgram.com/v1/listen",
          { url: voice.audioUrl },
          {
            headers: {
              Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
              "Content-Type": "application/json",
            },
            params: {
              model: "nova-2",
              language: sttLangCode,
              smart_format: true,
              vtt: true,
            },
          }
        );

        const result = dgResponse.data;
        if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
          throw new Error(`Deepgram STT returned empty result for "${sttLangCode}"`);
        }

        const vttContent = webvtt(result);
        const fileName = `captions/${seriesId}_${Date.now()}.vtt`;
        const publicUrl = await uploadBufferToSupabase(Buffer.from(vttContent), fileName, "text/vtt");
        console.log(`✅ Captions uploaded: ${publicUrl}`);
        return { captionsUrl: publicUrl };
      });

      // ── Step 5: Generate images in parallel
      const visualAnchor =
        `Consistent visual style: ${series.video_style?.title || "cinematic"}. Niche: ${series.niche}. ` +
        `Series: ${series.series_name}. Cinematic composition, high detail.`;

      const seed = Math.floor(Math.random() * 1000000);

      const generatedScenes = [];
      for (let i = 0; i < videoData.scenes.length; i++) {
        const scene = videoData.scenes[i];
        const result = await step.run(`generate-scene-${i + 1}-image`, async () => {
          let imageUrl;
          if (skipImages) {
            console.log(`🎨 [Fast Test] Skipping AI image generation for scene ${i + 1}. Using fallback.`);
            // Use the video style's main image as a placeholder
            imageUrl = series.video_style?.image ? `/${series.video_style.image}` : "/video-style/Realistic.png";
          } else {
            console.log(`🎨 Generating image for scene ${i + 1}/${videoData.scenes.length}...`);
            const fullPrompt = `${visualAnchor} Scene ${i + 1}: ${scene.imagePrompt}`;
            imageUrl = await generateImageWithFallback(fullPrompt, seed + i, format);
          }

          // Recovery point
          const currentScenes = videoData.scenes.slice(0, i + 1).map((s, j) => ({
            ...s,
            imageUrl: j === i ? imageUrl : undefined,
            estimatedDuration: estimateDurationSeconds(s.narrativeText),
          }));

          await supabase
            .from("generated_videos")
            .update({ scenes: currentScenes })
            .eq("id", placeholder.id);

          return {
            ...scene,
            imageUrl,
            estimatedDuration: estimateDurationSeconds(scene.narrativeText),
          };
        });
        generatedScenes.push(result);
      }

      // ── Step 5.5: Generate Thumbnail
      const thumbnailUrl = await step.run("generate-thumbnail", async () => {
        if (!generatedScenes[0]?.imageUrl) return null;
        return generateThumbnail(generatedScenes[0].imageUrl, videoData.title, seriesId);
      });

      // ── Step 5.6: Render MP4
      const renderedVideo = await step.run("render-mp4", async () => {
        console.log("🎬 Starting MP4 render...");
        const tmpDir = path.join(os.tmpdir(), "nxtai", `${seriesId}_render`);
        try {
          const outputPath = await renderMP4(generatedScenes, voice.audioUrl, seriesId, format, captions?.captionsUrl || null, series.caption_style);
          const videoFileName = `videos/${seriesId}_${Date.now()}.mp4`;
          const videoUrl = await uploadToSupabase(outputPath, videoFileName, "video/mp4");
          fs.rmSync(tmpDir, { recursive: true, force: true });
          return { videoUrl };
        } catch (err) {
          console.warn("⚠️ MP4 render failed:", err.message);
          if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
          return { videoUrl: null };
        }
      });

      // ── Step 5.7: Social metadata
      const socialMeta = await step.run("generate-social-metadata", async () => {
        return generateSocialMetadata(videoData, series.niche);
      });

      // ── Step 6: Finalize database record
      const savedResult = await step.run("finalize-database-record", async () => {
        const { data, error } = await supabase
          .from("generated_videos")
          .update({
            title: videoData.title,
            audio_url: voice.audioUrl,
            captions_url: captions.captionsUrl,
            video_url: renderedVideo.videoUrl,
            thumbnail_url: thumbnailUrl,
            scenes: generatedScenes,
            social_meta: socialMeta,
            hook: videoData.hook || null,
            cta: videoData.cta || null,
            status: "completed",
          })
          .eq("id", placeholder.id)
          .select()
          .single();

        if (error) throw new Error(`DB Finalize Error: ${error.message}`);
        return data;
      });

      // ── Step 7: Notify
      await step.run("notify-completion", async () => {
        try {
          // 1. In-app notification
          await supabase.from("notifications").insert({
            user_id: series.user_id,
            type: "video_ready",
            message: `Your video "${videoData.title}" is ready!`,
            video_id: placeholder.id,
            read: false,
          });

          // 2. Email notification via Plunk
          const user = await User.findById(series.user_id);
          if (user && user.email) {
            await sendVideoReadyEmail(user.email, {
              title: videoData.title,
              videoUrl: renderedVideo.videoUrl,
              thumbnailUrl,
              format
            });
          }

          // 3. Emit a 'completion' event for the scheduled workflow to pick up
          await inngest.send({
            name: "video/generation-completed",
            data: {
              seriesId: series.id,
              videoId: placeholder.id,
              videoUrl: renderedVideo.videoUrl,
              thumbnailUrl,
              title: videoData.title,
              userId: series.user_id
            }
          });
          
        } catch (err) {
          console.warn("⚠️ Notification failed:", err.message);
        }
      });

      return { success: true, id: savedResult.id };

    } catch (err) {
      console.error(`❌ Pipeline failed for ${placeholder.id}:`, err.message);
      await step.run("mark-as-failed", async () => {
        await supabase.from("generated_videos").update({ status: "failed" }).eq("id", placeholder.id);
      });
      throw err;
    }
  }
);

// ── Text to Video Function ─────────────────────────────────────────────────────
const generateTextToVideo = inngest.createFunction(
  {
    id: "text-to-video-generate",
    triggers: [{ event: "text-to-video/generate" }],
  },
  async ({ event, step }) => {
    const { prompt, userId } = event.data;
    const format = event.data.format || "landscape";

    // 1. Placeholder
    const placeholder = await step.run("create-placeholder", async () => {
      const { data, error } = await supabase
        .from("generated_videos")
        .insert({
          title: prompt.substring(0, 50) + (prompt.length > 50 ? "..." : ""),
          status: "generating",
          scenes: [],
          format,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Failed to create placeholder: ${error.message}`);
      return data;
    });

    try {
      // 2. 3 images
      const seed = Math.floor(Math.random() * 1000000);
      const imagePromises = [1, 2, 3].map(i =>
        step.run(`generate-image-${i}`, async () => {
          const stylePrompt = `Cinematic, photorealistic keyframe: ${prompt}`;
          const imageUrl = await generateImageWithFallback(stylePrompt, seed + i, format);
          return { imageUrl, prompt: stylePrompt };
        })
      );
      const generatedImages = await Promise.all(imagePromises);

      // 3. Thumbnail
      const thumbnailUrl = await step.run("generate-thumbnail", async () => {
        return generateThumbnail(generatedImages[0].imageUrl, prompt.substring(0, 40), placeholder.id);
      });

      // 4. Video via Wan 2.1
      const videoResult = await step.run("generate-video", async () => {
        const response = await axios.post(
          "https://fal.run/fal-ai/wan/v2.1/text-to-video",
          {
            prompt,
            num_frames: 81,
            aspect_ratio: format === "portrait" ? "9:16" : format === "square" ? "1:1" : "16:9",
          },
          {
            headers: {
              Authorization: `Key ${process.env.FAL_AI}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.data?.video?.url) throw new Error("Fal.ai returned no video URL");
        return response.data.video.url;
      });

      // 5. Finalize
      await step.run("finalize-record", async () => {
        await supabase
          .from("generated_videos")
          .update({
            video_url: videoResult,
            thumbnail_url: thumbnailUrl,
            scenes: generatedImages,
            status: "completed",
          })
          .eq("id", placeholder.id);
      });

      // 6. Notify
      await step.run("notify-completion", async () => {
        try {
          // 1. In-app notification
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "video_ready",
            message: `Your text-to-video is ready!`,
            video_id: placeholder.id,
            read: false,
          });

          // 2. Email notification via Plunk
          const user = await User.findById(userId);
          if (user && user.email) {
            await sendVideoReadyEmail(user.email, {
              title: prompt.substring(0, 50),
              videoUrl: videoResult,
              thumbnailUrl,
              format
            });
          }
        } catch (err) {
          console.warn("⚠️ Notification failed:", err.message);
        }
      });

      return { success: true, id: placeholder.id };
    } catch (err) {
      await step.run("mark-failed", async () => {
        await supabase.from("generated_videos").update({ status: "failed" }).eq("id", placeholder.id);
      });
      throw err;
    }
  }
);

// ─── Scheduled Publishing Logic ──────────────────────────────────────────────

/**
 * Cron job that runs every hour to check for series that need video generation.
 * Generation starts 2 hours before the scheduled publish time.
 */
const checkDailySchedules = inngest.createFunction(
  { id: "check-daily-schedules", name: "Hourly Schedule Check", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    console.log("🔍 Running Hourly Schedule Check...");
    const { data: activeSeriesResponse, error } = await step.run("fetch-active-series", async () => {
      const { data, error } = await supabase
        .from("video_series")
        .eq("status", "scheduled") // Looking for active/scheduled series
        .select("*");
      if (error) throw error;
      return { data: data || [] };
    });

    if (error) throw new Error(`Failed to fetch active series: ${error}`);

    const now = new Date();
    const currentUTCHour = now.getUTCHours();
    
    // We want to start generation 2 hours BEFORE publish time.
    const targetUTCHour = (currentUTCHour + 2) % 24;

    const seriesToTrigger = activeSeriesResponse.data.filter(series => {
      let publishHour = parseInt(series.publish_time.split(":")[0]);
      if (series.publish_period === "PM" && publishHour !== 12) publishHour += 12;
      if (series.publish_period === "AM" && publishHour === 12) publishHour = 0;
      
      return publishHour === targetUTCHour;
    });

    if (seriesToTrigger.length > 0) {
      console.log(`⏰ Cron found ${seriesToTrigger.length} series to start generating for hour ${targetUTCHour}:00 UTC`);
      
      const events = seriesToTrigger.map(s => ({
        name: "series/scheduled-workflow",
        data: { seriesId: s.id, isTest: false }
      }));

      await step.sendEvent("trigger-scheduled-workflows", events);
    }

    return { triggered: seriesToTrigger.length };
  }
);

/**
 * Comprehensive workflow for a scheduled series:
 * 1. Generates the video (via existing pipeline event)
 * 2. Waits until the scheduled publish time
 * 3. Publishes to all selected platforms
 */
const scheduledSeriesWorkflow = inngest.createFunction(
  { id: "scheduled-series-workflow", name: "Scheduled Series Workflow", triggers: [{ event: "series/scheduled-workflow" }] },
  async ({ event, step }) => {
    const { seriesId, isTest, skipImages } = event.data;
    console.log(`🎬 Starting scheduled workflow for series: ${seriesId} (Test: ${isTest})`);

    // ── Step 1: Trigger Generation
    await step.sendEvent("trigger-generation", {
        name: "video/generate",
        data: { seriesId, skipImages }
    });

    // Wait for the video to be completed.
    const generationResult = await step.waitForEvent("wait-for-generation", {
      event: "video/generation-completed",
      timeout: "20m",
      match: "data.seriesId == event.data.seriesId"
    });

    if (!generationResult) {
      throw new Error("Video generation timed out or failed.");
    }

    const { videoUrl, thumbnailUrl, title } = generationResult.data;

    // ── Step 2: Sleep until publish time (skip if isTest)
    if (!isTest) {
        const series = await step.run("fetch-series-for-sleep", async () => {
            const { data } = await supabase.from("video_series").select("*").eq("id", seriesId).single();
            return data;
        });

        let publishHour = parseInt(series.publish_time.split(":")[0]);
        if (series.publish_period === "PM" && publishHour !== 12) publishHour += 12;
        if (series.publish_period === "AM" && publishHour === 12) publishHour = 0;

        const now = new Date();
        const publishDate = new Date(now);
        publishDate.setUTCHours(publishHour, 0, 0, 0);

        if (publishDate < now) {
            publishDate.setUTCDate(publishDate.getUTCDate() + 1);
        }

        console.log(`😴 Series ${seriesId} sleeping until ${publishDate.toISOString()} for publishing...`);
        await step.sleepUntil("wait-until-publish-time", publishDate);
    }

    // ── Step 3: Publish to Platforms
    const series = await step.run("fetch-series-for-publish", async () => {
        const { data } = await supabase.from("video_series").select("*").eq("id", seriesId).single();
        return data;
    });

    const platforms = series.platforms || [];
    console.log(`🚀 Publishing series ${seriesId} to platforms: ${platforms.join(", ")}`);

    if (platforms.includes("email")) {
        await step.run("publish-to-email", async () => {
            const user = await User.findById(series.user_id);
            if (user && user.email) {
                await sendVideoReadyEmail(user.email, {
                    title,
                    videoUrl,
                    thumbnailUrl,
                    format: series.format || "landscape"
                });
                return { platform: "email", success: true };
            }
            return { platform: "email", success: false, reason: "User not found" };
        });
    }

    if (platforms.includes("youtube")) {
        await step.run("publish-to-youtube-placeholder", async () => {
            console.log(`[YouTube API Placeholder] Publishing video "${title}"...`);
            return { platform: "youtube", status: "placeholder_sent" };
        });
    }

    if (platforms.includes("instagram")) {
        await step.run("publish-to-instagram-placeholder", async () => {
            console.log(`[Instagram API Placeholder] Publishing video "${title}"...`);
            return { platform: "instagram", status: "placeholder_sent" };
        });
    }

    return { success: true, platforms };
  }
);

module.exports = [
  helloWorld,
  generateVideo,
  generateTextToVideo,
  checkDailySchedules,
  scheduledSeriesWorkflow,
];