const express = require("express");
const router = express.Router();
const User = require("../models/user");
const creditCosts = require("../config/creditCosts"); // ✅ import once at top
const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  login,
  checkAuth,
  logout,
} = require("./../controllers/auth/auth-controller");

router.post("/register", register);
router.post("/login", login);
router.get("/checkAuth", checkAuth);
router.post("/logout", logout);

// ✅ Fix — register the route so it can actually be called
router.post("/deduct", authMiddleware, async (req, res) => {
  try {
    const { feature } = req.body;

    // ✅ Remove duplicate require — use top-level import
    const cost = creditCosts[feature] ?? 1;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }



    // Reset check — 24hr
    const now = new Date();
    const lastReset = new Date(user.lastCreditReset);
    const hoursPassed = (now - lastReset) / (1000 * 60 * 60);

    if (hoursPassed >= 24) {
      user.credits = 100;
      user.lastCreditReset = now;
      console.log(`✅ Credits reset for ${user.email}`);
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

    return res.status(200).json({
      success: true,
      remainingCredits: user.credits,
    });

  } catch (error) {
    console.error("Deduct credits error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;