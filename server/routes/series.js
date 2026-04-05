const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { createSeries, getSeriesById, updateSeries, generateSeries } = require("../controllers/seriesController");

/**
 * @desc    Save a new video series
 * @route   POST /api/series/create
 * @access  Private
 */
router.post("/create", authMiddleware, createSeries);

/**
 * @desc    Get a single series by ID
 * @route   GET /api/series/:id
 * @access  Private
 */
router.get("/:id", authMiddleware, getSeriesById);

router.put("/update/:id", authMiddleware, updateSeries);

/**
 * @desc    Trigger video generation for a series
 * @route   POST /api/series/generate
 * @access  Private
 */
router.post("/generate", authMiddleware, generateSeries);

module.exports = router;
