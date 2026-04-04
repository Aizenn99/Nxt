const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { createSeries } = require("../controllers/seriesController");

/**
 * @desc    Save a new video series
 * @route   POST /api/series/create
 * @access  Private
 */
router.post("/create", authMiddleware, createSeries);

module.exports = router;
