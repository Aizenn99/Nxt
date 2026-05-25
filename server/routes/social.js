const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  youtubeAuth,
  youtubeCallback,
  instagramAuth,
  instagramCallback,
} = require("../controllers/socialController");

// YouTube OAuth
router.get("/youtube/auth", authMiddleware, youtubeAuth);
router.get("/youtube/callback", youtubeCallback);

// Instagram OAuth
router.get("/instagram/auth", authMiddleware, instagramAuth);
router.get("/instagram/callback", instagramCallback);

module.exports = router;
