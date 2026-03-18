const ChatHistory = require("../../models/chathistory");
const crypto = require("crypto");

/*
--------------------------------
SAVE CHAT HISTORY
--------------------------------
*/
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

    res.json({
      success: true,
      chats: chatHistory.chats,
    });
  } catch (err) {
    console.error("Chat history error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/*
--------------------------------
GET CHAT HISTORY
--------------------------------
*/
const getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const chatHistory = await ChatHistory.findOne({ userId });

    res.json(chatHistory ? chatHistory.chats : []);
  } catch (err) {
    console.error("Chat history error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/*
--------------------------------
DELETE CHAT
--------------------------------
*/
const deleteChatById = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      return res.status(404).json({ error: "Chat history not found" });
    }

    chatHistory.chats = chatHistory.chats.filter((chat) => chat.id !== chatId);

    await chatHistory.save();

    res.json({
      success: true,
      message: "Chat deleted successfully",
      chats: chatHistory.chats,
    });
  } catch (err) {
    console.error("Chat delete error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/*
--------------------------------
RENAME CHAT
--------------------------------
*/
const renameChat = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const { title } = req.body;

    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      return res.status(404).json({ error: "Chat history not found" });
    }

    const chat = chatHistory.chats.find((c) => c.id === chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.title = title;

    await chatHistory.save();

    res.json({
      success: true,
      chats: chatHistory.chats,
    });
  } catch (err) {
    console.error("Rename chat error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/*
--------------------------------
PIN / UNPIN CHAT
--------------------------------
*/
const pinChat = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      return res.status(404).json({ error: "Chat history not found" });
    }

    const chat = chatHistory.chats.find((c) => c.id === chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.pinned = !chat.pinned;

    await chatHistory.save();

    res.json({
      success: true,
      chats: chatHistory.chats,
    });
  } catch (err) {
    console.error("Pin chat error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/*
--------------------------------
SHARE CHAT
--------------------------------
*/
const shareChat = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      return res.status(404).json({ error: "Chat history not found" });
    }

    const chat = chatHistory.chats.find((c) => c.id === chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.shareId) {
      chat.shareId = crypto.randomBytes(8).toString("hex");
      await chatHistory.save();
    }

    const shareUrl = `${process.env.CLIENT_URL}/share/${chat.shareId}`;

    res.json({
      success: true,
      shareUrl,
    });
  } catch (err) {
    console.error("Share chat error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/*
--------------------------------
CLEAR ALL HISTORY
--------------------------------
*/
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
    console.error("Clear history error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

module.exports = {
  saveChatHistory,
  getChatHistory,
  deleteChatById,
  renameChat,
  pinChat,
  shareChat,
  clearAllChatHistory,
};
