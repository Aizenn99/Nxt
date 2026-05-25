const { google } = require("googleapis");
const axios = require("axios");
const SocialAccount = require("../models/SocialAccount");

// OAuth2 Configuration for YouTube
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

/**
 * Initiates YouTube OAuth flow
 */
exports.youtubeAuth = (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: req.userId, // Pass userId in state to verify on callback
  });

  res.json({ url });
};

/**
 * Handles YouTube OAuth callback
 */
exports.youtubeCallback = async (req, res) => {
  const { code, state: userId } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch channel details
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const channelRes = await youtube.channels.list({
      part: "snippet",
      mine: true,
    });

    const channel = channelRes.data.items[0];
    const platformId = channel.id;
    const platformName = channel.snippet.title;

    // Save tokens to DB
    await SocialAccount.findOneAndUpdate(
      { userId, platform: "youtube" },
      {
        platformId,
        platformName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      },
      { upsert: true, new: true }
    );

    // Redirect to settings page on frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=success&platform=youtube`);
  } catch (error) {
    console.error("YouTube OAuth Error:", error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error&message=auth_failed`);
  }
};

/**
 * Initiates Instagram Auth flow (Meta Graph API)
 */
exports.instagramAuth = (req, res) => {
  const appId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI);
  const scope = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";
  
  const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${req.userId}&response_type=code`;
  
  res.json({ url });
};

/**
 * Handles Instagram OAuth callback
 */
exports.instagramCallback = async (req, res) => {
  const { code, state: userId } = req.query;
  
  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
      params: {
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code,
      },
    });
    
    const shortToken = tokenRes.data.access_token;
    
    // 2. Exchange for long-lived token
    const longTokenRes = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        fb_exchange_token: shortToken,
      },
    });
    
    const accessToken = longTokenRes.data.access_token;
    
    // 3. For Instagram Graph API, we need the IG User ID linked to a FB Page.
    // For this implementation, we'll store the token and a placeholder for now.
    // In a full implementation, you'd fetch the IG Business Account ID here.
    
    await SocialAccount.findOneAndUpdate(
      { userId, platform: "instagram" },
      {
        platformId: "pending_meta_verification",
        platformName: "Instagram Business Account",
        accessToken,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
      },
      { upsert: true, new: true }
    );
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=success&platform=instagram`);
  } catch (error) {
    console.error("Instagram OAuth Error:", error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error&message=auth_failed`);
  }
};
