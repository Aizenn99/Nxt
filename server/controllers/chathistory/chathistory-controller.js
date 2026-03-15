const ChatHistory = require("../../models/chathistory");

const saveChatHistory = async (req, res) => {
  try {
    const { chats } = req.body;
    const userId = req.userId;

    let chatHistory = await ChatHistory.findOne({ userId });

    if (chatHistory) {
      chatHistory.chats = chats;
      await chatHistory.save();
    } else {
      chatHistory = new ChatHistory({ userId, chats });
      await chatHistory.save();
    }

    res.json({ success: true, chatHistory });
  } catch (err) {
    console.error("Chat history error:", err.message);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
};

const clearAllChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const chatHistory = await ChatHistory.findOne({ userId });
    if (chatHistory) {
      chatHistory.chats = [];
      await chatHistory.save();
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Chat history error:", err.message);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const chatHistory = await ChatHistory.findOne({ userId });
    res.json(chatHistory ? chatHistory.chats : []);
  } catch (err) {
    console.error("Chat history error:", err.message);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
};

const deleteChatById = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chatHistory = await ChatHistory.findOne({ userId });
    if (chatHistory) {
      chatHistory.chats = chatHistory.chats.filter((chat) => chat.id !== chatId);
      await chatHistory.save();
      return res.json({ success: true, message: "Chat deleted successfully", chats: chatHistory.chats });
    }

    res.status(404).json({ error: "Chat history not found" });
  } catch (err) {
    console.error("Chat delete error:", err.message);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
};

module.exports = {
  saveChatHistory,
  clearAllChatHistory,
  getChatHistory,
  deleteChatById,
};
