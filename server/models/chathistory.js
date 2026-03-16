const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    chats: [
      {
        id: { type: String, required: true },
        title: { type: String, default: "New Chat" },
        pinned: { type: Boolean, default: false },
        shareId: { type: String, default: null },

        messages: [
          {
            role: {
              type: String,
              enum: ["user", "assistant"],
              required: true,
            },
            content: { type: String, required: true },
            timestamp: { type: Number, default: Date.now },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
