const express = require("express");
const {
  startAgent,
  getStreamToken,
  automateTasks,
} = require("../controllers/agentcon/AgentController");

const router = express.Router();

router.post("/token", getStreamToken);
router.post("/start", startAgent);
router.post("/automate", automateTasks);

module.exports = router;