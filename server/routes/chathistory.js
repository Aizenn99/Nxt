const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  saveChatHistory,
  clearAllChatHistory,
  getChatHistory,
  deleteChatById,
} = require("../controllers/chathistory/chathistory-controller");

router.post("/", authMiddleware, saveChatHistory);
router.delete("/", authMiddleware, clearAllChatHistory);
router.get("/", authMiddleware, getChatHistory);
router.delete("/:chatId", authMiddleware, deleteChatById);

module.exports = router;
