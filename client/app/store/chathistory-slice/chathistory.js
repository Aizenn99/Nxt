import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Using NEXT_PUBLIC_API_URL for Next.js app
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const saveChatHistory = createAsyncThunk(
  "chatHistory/save",
  async (messages) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/chathistory`,
        { messages },
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      console.error("Error saving chat history:", error);
      throw error;
    }
  },
);

export const getChatHistory = createAsyncThunk("chatHistory/get", async () => {
  try {
    const response = await axios.get(`${API_URL}/api/chathistory`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting chat history:", error);
    throw error;
  }
});

export const deleteChatHistory = createAsyncThunk(
  "chatHistory/delete",
  async () => {
    try {
      const response = await axios.delete(`${API_URL}/api/chathistory`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting chat history:", error);
      throw error;
    }
  },
);

export const renameChat = createAsyncThunk(
  "chatHistory/rename",
  async ({ chatId, title }) => {
    try {
      const response = await axios.put(`${API_URL}/api/chathistory/${chatId}/rename`, { title }, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error renaming chat:", error);
      throw error;
    }
  },
);

export const pinChat = createAsyncThunk(
  "chatHistory/pin",
  async (chatId) => {
    try {
      const response = await axios.put(`${API_URL}/api/chathistory/${chatId}/pin`, {}, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error pinning chat:", error);
      throw error;
    }
  },
);

export const shareChat = createAsyncThunk(
  "chatHistory/share",
  async (chatId) => {
    try {
      // Assuming a share returns a public URL or similar
      const response = await axios.post(`${API_URL}/api/chathistory/${chatId}/share`, {}, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error sharing chat:", error);
      throw error;
    }
  },
);

export const deleteChatById = createAsyncThunk(
  "chatHistory/deleteById",
  async (chatId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/chathistory/${chatId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting chat by id:", error);
      throw error;
    }
  },
);

const chatHistorySlice = createSlice({
  name: "chatHistory",
  initialState: {
    history: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(saveChatHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(saveChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getChatHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.error = null;
      })
      .addCase(getChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteChatById.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteChatById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.chats) {
          state.history = action.payload.chats;
        }
        state.error = null;
      })
      .addCase(deleteChatById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(renameChat.pending, (state) => {
        state.loading = true;
      })
      .addCase(renameChat.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.chats) {
          state.history = action.payload.chats;
        }
        state.error = null;
      })
      .addCase(renameChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(pinChat.pending, (state) => {
        state.loading = true;
      })
      .addCase(pinChat.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.chats) {
          state.history = action.payload.chats;
        }
        state.error = null;
      })
      .addCase(pinChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(shareChat.pending, (state) => {
        state.loading = true;
      })
      .addCase(shareChat.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(shareChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default chatHistorySlice.reducer;

