const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { createSeries, getSeriesById, updateSeries } = require("../controllers/seriesController");

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

/**
 * @desc    Update an existing series
 * @route   PUT /api/series/update/:id
 * @access  Private
 */
router.put("/update/:id", authMiddleware, updateSeries);

module.exports = router;
