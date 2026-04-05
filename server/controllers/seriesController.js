const { supabase } = require("../config/supabase");
const { inngest } = require("../inngest/client");

/**
 * @desc    Save a new video series to Supabase
 * @route   POST /api/series/create
 * @access  Private
 */
const createSeries = async (req, res) => {
  const {
    niche,
    customNiche,
    isCustom,
    languageObj,
    voiceObj,
    bgMusic,
    videoStyle,
    captionStyle,
    seriesName,
    duration,
    platforms,
    publishTime,
    publishPeriod,
  } = req.body;

  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  if (!seriesName) {
    return res.status(400).json({ message: "Series name is required" });
  }

  try {
    const { data, error } = await supabase
      .from("video_series")
      .insert([
        {
          user_id: userId,
          niche,
          custom_niche: customNiche,
          is_custom: isCustom,
          language_obj: languageObj,
          voice_obj: voiceObj,
          bg_music: bgMusic,
          video_style: videoStyle,
          caption_style: captionStyle,
          series_name: seriesName,
          duration,
          platforms,
          publish_time: publishTime,
          publish_period: publishPeriod,
          status: "scheduled",
        },
      ])
      .select();

    if (error) {
      console.error("Supabase Error:", error.message);
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: "Series created and scheduled successfully",
    });
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc    Fetch a single series by ID
 * @route   GET /api/series/:id
 * @access  Private
 */
const getSeriesById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const { data, error } = await supabase
      .from("video_series")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      return res.status(404).json({ message: "Series not found" });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc    Update an existing video series
 * @route   PUT /api/series/update/:id
 * @access  Private
 */
const updateSeries = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const updateData = req.body;

  // Remove fields that should not be updated manually
  delete updateData.id;
  delete updateData.user_id;
  delete updateData.created_at;

  try {
    const { data, error } = await supabase
      .from("video_series")
      .update({
        niche: updateData.niche,
        custom_niche: updateData.customNiche,
        is_custom: updateData.isCustom,
        language_obj: updateData.languageObj,
        voice_obj: updateData.voiceObj,
        bg_music: updateData.bgMusic,
        video_style: updateData.videoStyle,
        caption_style: updateData.captionStyle,
        series_name: updateData.seriesName,
        duration: updateData.duration,
        platforms: updateData.platforms,
        publish_time: updateData.publishTime,
        publish_period: updateData.publishPeriod,
        status: updateData.status || "scheduled",
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ message: "Series not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      data: data[0],
      message: "Series updated successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc    Trigger video generation for a series
 * @route   POST /api/series/generate
 * @access  Private
 */
const generateSeries = async (req, res) => {
  const { seriesId } = req.body;
  const userId = req.userId;

  if (!seriesId) {
    return res.status(400).json({ message: "Series ID is required" });
  }

  try {
    // Verify ownership
    const { data: series, error: fetchError } = await supabase
      .from("video_series")
      .select("id")
      .eq("id", seriesId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !series) {
      return res.status(404).json({ message: "Series not found or unauthorized" });
    }

    console.log("🚀 Triggering Inngest event for series:", seriesId);

    // Trigger Inngest event
    const result = await inngest.send({
      name: "video/generate",
      data: { seriesId },
    });

    console.log("✅ Inngest send result:", result);

    res.status(200).json({
      success: true,
      message: "Video generation triggered successfully",
    });
  } catch (err) {
    console.error("Generation Trigger Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = { createSeries, getSeriesById, updateSeries, generateSeries };
