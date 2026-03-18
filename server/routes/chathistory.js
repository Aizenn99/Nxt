const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  saveChatHistory,
  clearAllChatHistory,
  getChatHistory,
  deleteChatById,
  renameChat,
  pinChat,
  shareChat,
} = require("../controllers/chathistory/chathistory-controller");

router.post("/", authMiddleware, saveChatHistory);
router.delete("/", authMiddleware, clearAllChatHistory);
router.get("/", authMiddleware, getChatHistory);
router.delete("/:chatId", authMiddleware, deleteChatById);
router.put("/:chatId/rename", authMiddleware, renameChat);
router.put("/:chatId/pin", authMiddleware, pinChat);
router.post("/:chatId/share", authMiddleware, shareChat);

module.exports = router;
