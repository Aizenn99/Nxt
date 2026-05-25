const User = require("../models/user");
const SocialAccount = require("../models/SocialAccount");

/**
 * Get all connected social accounts for the user
 */
exports.getUserAccounts = async (req, res) => {
  try {
    const accounts = await SocialAccount.find({ userId: req.userId }).select(
      "platform platformName platformId createdAt"
    );
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

/**
 * Disconnect a social account
 */
exports.disconnectAccount = async (req, res) => {
  try {
    const { platform } = req.params;
    await SocialAccount.findOneAndDelete({ userId: req.userId, platform });
    res.json({ success: true, message: `${platform} disconnected successfully` });
  } catch (error) {
    res.status(500).json({ message: "Failed to disconnect account" });
  }
};

/**
 * Diagnostic test for Plunk
 */
exports.testPlunk = async (req, res) => {
  const apiKey = (process.env.PLUNK_API_KEY || "").trim();
  const maskedKey = `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`;
  
  try {
    const Plunk = require("@plunk/node").default;
    const plunk = new Plunk(apiKey);
    
    await plunk.emails.send({
      to: "amitk@nxtai.io",
      subject: "Plunk Diagnostic Test",
      body: "If you see this, Plunk is working correctly.",
    });
    
    res.json({ 
      success: true, 
      message: "Diagnostic email sent successfully!",
      keyUsed: maskedKey,
      keyLength: apiKey.length 
    });
  } catch (error) {
    console.error("❌ Plunk Diagnostic Error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      keyUsed: maskedKey,
      keyLength: apiKey.length 
    });
  }
};

/**
 * Delete User Account (Danger Zone)
 */
exports.deleteUserAccount = async (req, res) => {
  try {
    // 1. Delete Social Accounts
    await SocialAccount.deleteMany({ userId: req.userId });

    // 2. Delete User
    await User.findByIdAndDelete(req.userId);

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete account" });
  }
};
