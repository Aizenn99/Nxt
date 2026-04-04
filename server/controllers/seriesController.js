const { supabase } = require("../config/supabase");

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

module.exports = { createSeries };
