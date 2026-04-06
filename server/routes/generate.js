const express = require("express");
const { inngest } = require("../inngest/client");
const router = express.Router();

// Trigger Text to Video Generation
router.post("/text-to-video", async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Trigger Inngest event
    await inngest.send({
      name: "text-to-video/generate",
      data: {
        prompt,
        userId,
      },
    });

    res.status(200).json({ success: true, message: "Generation started" });
  } catch (err) {
    console.error("Text-to-Video Trigger Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
