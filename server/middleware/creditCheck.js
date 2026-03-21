const User = require("../models/user");
const creditCosts = require("../config/creditCosts");

const DAILY_CREDITS = 100;

const checkCredits = (feature) => async (req, res, next) => {
  const cost = creditCosts[feature];

  if (cost === undefined) {
    return res.status(500).json({ message: `Unknown feature: ${feature}` });
  }

  try {
    // ✅ Fix 1: use req.user.id not req.userId
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Reset check
    const now = new Date();
    const lastReset = new Date(user.lastCreditReset);
    const hoursPassed = (now - lastReset) / (1000 * 60 * 60);

    if (hoursPassed >= 24) {
      user.credits = DAILY_CREDITS;
      user.lastCreditReset = now;
      await user.save();
      console.log(`✅ Credits reset for user ${user.email}`);
    }

    if (user.credits < cost) {
      return res.status(403).json({
        message: "Insufficient credits",
        required: cost,
        remaining: user.credits,
      });
    }

    user.credits -= cost;
    await user.save();

    req.remainingCredits = user.credits;
    next();
  } catch (error) {
    console.error("Credit check error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = checkCredits;