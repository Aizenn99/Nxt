const mongoose = require("mongoose");

const socialAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  platform: {
    type: String,
    enum: ["youtube", "instagram"],
    required: true,
  },
  platformId: {
    type: String, // Channel ID for YouTube, Username/ID for IG
    required: true,
  },
  platformName: {
    type: String, // Channel Title or Display Name
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
  },
  expiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SocialAccount", socialAccountSchema);
