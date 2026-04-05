const express = require("express");
const { serve } = require("inngest/express");
const { inngest } = require("../inngest/client");
const functions = require("../inngest/functions");

const router = express.Router();

// Serve the Inngest functions
router.all(
  "/",
  serve({
    client: inngest,
    functions: functions,
  }),
);

module.exports = router;
