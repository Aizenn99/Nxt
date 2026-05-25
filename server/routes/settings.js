const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserAccounts,
  disconnectAccount,
  deleteUserAccount,
} = require("../controllers/settingsController");

// Get all connected social accounts
router.get("/accounts", authMiddleware, getUserAccounts);

// Diagnostic Plunk test
router.get("/test-plunk", authMiddleware, require("../controllers/settingsController").testPlunk);

// Disconnect a specific platform
router.delete("/account/:platform", authMiddleware, disconnectAccount);

// Delete User Account (Danger Zone)
router.delete("/delete-user", authMiddleware, deleteUserAccount);

module.exports = router;
