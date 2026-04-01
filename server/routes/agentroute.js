const express = require("express");
const {
  startAgent,
  getStreamToken,
} = require("../controllers/agentcon/AgentController");

const router = express.Router();

router.post("/token", getStreamToken);
router.post("/start", startAgent);

module.exports = router;