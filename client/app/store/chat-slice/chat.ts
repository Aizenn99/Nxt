import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { updateCredits, logoutUser } from "../auth-slice/auth";

<<<<<<< HEAD
const API_URL = process.env.VITE_API_URL || "http://localhost:5000";
=======
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  pinned?: boolean;
  shareId?: string | null;
  messages: Message[];
}

interface ChatState {
  currentChatId: string | null;
  chats: Chat[];
  isLoading: boolean;
  selectedModel: string;
}

const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const getInitialChatId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("currentChatId");
  }
  return null;
};

const initialState: ChatState = {
  currentChatId: getInitialChatId(),
  chats: [],
  isLoading: false,
  selectedModel: "llama-3.3-70b-versatile",
};

// ─────────────────────────────────────────────────────────────
// FIX 1: All thunks declared ABOVE createSlice so extraReducers
//         can reference them without a ReferenceError
// ─────────────────────────────────────────────────────────────

export const fetchChatHistory = createAsyncThunk(
  "chat/fetchHistory",
  async (_, { dispatch }) => {
    try {
      const res = await axios.get(`${API_URL}/api/chathistory`, {
        withCredentials: true,
      });
      if (Array.isArray(res.data)) {
        dispatch(setChats(res.data));
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  }
);

export const syncChatHistory = createAsyncThunk(
  "chat/syncHistory",
  async (_, { getState }) => {
    const state = getState() as { chat: ChatState };
    try {
      await axios.post(
        `${API_URL}/api/chathistory`,
        { chats: state.chat.chats },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Sync history error:", err);
    }
  }
);

export const deleteChatById = createAsyncThunk(
  "chat/delete",
  async (chatId: string) => {
    await axios.delete(`${API_URL}/api/chathistory/${chatId}`, {
      withCredentials: true,
    });
    return { chatId };
  }
);

export const renameChat = createAsyncThunk(
  "chat/rename",
  async ({ chatId, title }: { chatId: string; title: string }) => {
    await axios.put(
      `${API_URL}/api/chathistory/${chatId}/rename`,
      { title },
      { withCredentials: true }
    );
  }
);

export const pinChat = createAsyncThunk(
  "chat/pin",
  async (chatId: string) => {
    await axios.put(
      `${API_URL}/api/chathistory/${chatId}/pin`,
      {},
      { withCredentials: true }
    );
    return chatId;
  }
);

export const shareChat = createAsyncThunk(
  "chat/share",
  async (chatId: string) => {
    const res = await axios.post(
      `${API_URL}/api/chathistory/${chatId}/share`,
      {},
      { withCredentials: true }
    );
    return { chatId, shareId: res.data.shareId };
  }
);

export const sendChatMessage = createAsyncThunk(
  "chat/send",
  async (userText: string, { dispatch, getState }) => {
    const state = getState() as { chat: ChatState };

    let chatId = state.chat.currentChatId;

    if (!chatId) {
      dispatch(startNewChat());
      const updated = getState() as { chat: ChatState };
      chatId = updated.chat.currentChatId!;
    }

    // FIX 4: Capture history BEFORE dispatching the new user message
    //         so the user message is not duplicated in the LLM context
    const existingHistory =
      (getState() as { chat: ChatState }).chat.chats
        .find((c) => c.id === chatId)
        ?.messages.map((m) => ({ role: m.role, content: m.content })) ?? [];

    const fullHistory = [
      ...existingHistory,
      { role: "user" as const, content: userText },
    ];

    dispatch(
      addMessage({
        chatId,
        message: {
          role: "user",
          content: userText,
          timestamp: Date.now(),
        },
      })
    );

    dispatch(setLoading(true));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullHistory,
          model: state.chat.selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "API error");

      if (data.remainingCredits !== undefined) {
        dispatch(updateCredits(data.remainingCredits));
      }

      dispatch(
        addMessage({
          chatId,
          message: {
            role: "assistant",
            content: data.reply,
            timestamp: Date.now(),
          },
        })
      );
    } catch (err: any) {
      dispatch(
        addMessage({
          chatId,
          message: {
            role: "assistant",
            content: `⚠️ ${err.message}`,
            timestamp: Date.now(),
          },
        })
      );
    } finally {
      dispatch(setLoading(false));
      dispatch(syncChatHistory());
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    startNewChat(state) {
      const id = generateId();
<<<<<<< HEAD
=======

>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
      const newChat: Chat = {
        id,
        title: "New Chat",
        pinned: false,
        messages: [],
      };
<<<<<<< HEAD
=======

>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
      state.chats.push(newChat);
      state.currentChatId = id;

      if (typeof window !== "undefined") {
        localStorage.setItem("currentChatId", id);
      }
    },

    addMessage(
      state,
      action: PayloadAction<{ chatId: string; message: Omit<Message, "id"> }>
    ) {
      const { chatId, message } = action.payload;

      const chat = state.chats.find((c) => c.id === chatId);
      if (!chat) return;

      const newMsg: Message = { ...message, id: generateId() };

      chat.messages.push(newMsg);

<<<<<<< HEAD
=======
      // Auto title only if default title
>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
      if (
        chat.messages.length === 1 &&
        message.role === "user" &&
        chat.title === "New Chat"
      ) {
        chat.title =
          message.content.length > 40
            ? message.content.slice(0, 40) + "…"
            : message.content;
      }
    },

    setChats(state, action: PayloadAction<Chat[]>) {
      state.chats = action.payload;
<<<<<<< HEAD
      if (state.currentChatId) {
        const exists = state.chats.some((c) => c.id === state.currentChatId);
=======

      if (state.currentChatId) {
        const exists = state.chats.some((c) => c.id === state.currentChatId);

>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
        if (!exists) {
          state.currentChatId = null;

          if (typeof window !== "undefined") {
            localStorage.removeItem("currentChatId");
          }
        }
      }
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    switchChat(state, action: PayloadAction<string>) {
      state.currentChatId = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("currentChatId", action.payload);
      }
    },

    clearCurrentChat(state) {
      state.currentChatId = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("currentChatId");
      }
    },

    setSelectedModel(state, action: PayloadAction<string>) {
      state.selectedModel = action.payload;
    },
  },

  extraReducers: (builder) => {
    // Logout — clear everything
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.chats = [];
      state.currentChatId = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("currentChatId");
      }
    });

<<<<<<< HEAD
    // Delete chat
=======
>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
    builder.addCase(deleteChatById.fulfilled, (state, action) => {
      state.chats = state.chats.filter(
        (chat) => chat.id !== action.payload.chatId
      );
<<<<<<< HEAD
=======

>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
      if (state.currentChatId === action.payload.chatId) {
        state.currentChatId = null;

        if (typeof window !== "undefined") {
          localStorage.removeItem("currentChatId");
        }
      }
    });

<<<<<<< HEAD
    // Rename chat
    builder.addCase(renameChat.fulfilled, (state, action) => {
      const { chatId, title } = action.meta.arg;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) chat.title = title;
    });

    // Pin chat — optimistic toggle with rollback on failure
    builder.addCase(pinChat.fulfilled, (state, action) => {
      const chatId = action.meta.arg;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) chat.pinned = !chat.pinned;
    });
    // FIX 3: Revert pin toggle if backend call fails
    builder.addCase(pinChat.rejected, (state, action) => {
      const chatId = action.meta.arg;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) chat.pinned = !chat.pinned;
    });

    // FIX 6: Handle shareChat fulfilled — store shareId on the chat
    builder.addCase(shareChat.fulfilled, (state, action) => {
      const { chatId, shareId } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) chat.shareId = shareId;
=======
    builder.addCase(renameChat.fulfilled, (state, action) => {
      const { chatId, title } = action.meta.arg;

      const chat = state.chats.find((c) => c.id === chatId);

      if (chat) {
        chat.title = title;
      }
    });

    builder.addCase(pinChat.fulfilled, (state, action) => {
      const chatId = action.meta.arg;

      const chat = state.chats.find((c) => c.id === chatId);

      if (chat) {
        chat.pinned = !chat.pinned;
      }
>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
    });
  },
});

export const {
  startNewChat,
  addMessage,
  setChats,
  setLoading,
  switchChat,
  clearCurrentChat,
  setSelectedModel,
} = chatSlice.actions;

export default chatSlice.reducer;

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────

=======
>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
export const selectCurrentChat = (state: { chat: ChatState }) =>
  state.chat.chats.find((c) => c.id === state.chat.currentChatId) ?? null;

export const selectMessages = (state: { chat: ChatState }) =>
  selectCurrentChat(state)?.messages ?? [];

export const selectIsLoading = (state: { chat: ChatState }) =>
  state.chat.isLoading;

export const selectChats = (state: { chat: ChatState }) =>
<<<<<<< HEAD
  [...state.chat.chats].sort((a, b) => Number(b.pinned) - Number(a.pinned));
=======
  [...state.chat.chats].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned)
  );
>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b

export const selectCurrentChatId = (state: { chat: ChatState }) =>
  state.chat.currentChatId;

export const selectSelectedModel = (state: { chat: ChatState }) =>
<<<<<<< HEAD
  state.chat.selectedModel;
=======
  state.chat.selectedModel;

export const fetchChatHistory = createAsyncThunk(
  "chat/fetchHistory",
  async (_, { dispatch }) => {
    try {
      const res = await axios.get(`${API_URL}/api/chathistory`, {
        withCredentials: true,
      });

      if (Array.isArray(res.data)) {
        dispatch(setChats(res.data));
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  }
);

export const syncChatHistory = createAsyncThunk(
  "chat/syncHistory",
  async (_, { getState }) => {
    const state = getState() as { chat: ChatState };

    try {
      await axios.post(
        `${API_URL}/api/chathistory`,
        { chats: state.chat.chats },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Sync history error:", err);
    }
  }
);

export const deleteChatById = createAsyncThunk(
  "chat/delete",
  async (chatId: string) => {
    await axios.delete(`${API_URL}/api/chathistory/${chatId}`, {
      withCredentials: true,
    });

    return { chatId };
  }
);

export const renameChat = createAsyncThunk(
  "chat/rename",
  async ({ chatId, title }: { chatId: string; title: string }) => {
    await axios.put(
      `${API_URL}/api/chathistory/${chatId}/rename`,
      { title },
      { withCredentials: true }
    );
  }
);

export const pinChat = createAsyncThunk("chat/pin", async (chatId: string) => {
  await axios.put(
    `${API_URL}/api/chathistory/${chatId}/pin`,
    {},
    { withCredentials: true }
  );
});

export const shareChat = createAsyncThunk(
  "chat/share",
  async (chatId: string) => {
    const res = await axios.post(
      `${API_URL}/api/chathistory/${chatId}/share`,
      {},
      { withCredentials: true }
    );

    return res.data;
  }
);

export const sendChatMessage = createAsyncThunk(
  "chat/send",
  async (userText: string, { dispatch, getState }) => {
    const state = getState() as { chat: ChatState };

    let chatId = state.chat.currentChatId;

    if (!chatId) {
      dispatch(startNewChat());
      const updated = getState() as { chat: ChatState };
      chatId = updated.chat.currentChatId!;
    }

    dispatch(
      addMessage({
        chatId,
        message: {
          role: "user",
          content: userText,
          timestamp: Date.now(),
        },
      })
    );

    dispatch(setLoading(true));

    try {
      const latest = getState() as { chat: ChatState };

      const history =
        latest.chat.chats
          .find((c) => c.id === chatId)
          ?.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })) ?? [];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          model: state.chat.selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "API error");

      if (data.remainingCredits !== undefined) {
        dispatch(updateCredits(data.remainingCredits));
      }

      dispatch(
        addMessage({
          chatId,
          message: {
            role: "assistant",
            content: data.reply,
            timestamp: Date.now(),
          },
        })
      );
    } catch (err: any) {
      dispatch(
        addMessage({
          chatId,
          message: {
            role: "assistant",
            content: `⚠️ ${err.message}`,
            timestamp: Date.now(),
          },
        })
      );
    } finally {
      dispatch(setLoading(false));
      dispatch(syncChatHistory());
    }
  }
);
>>>>>>> e0600907c74a84c7dad77bc70edd59a0aecf934b
