"use client";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice/auth";
import chatReducer from "./chat-slice/chat";
import imageReducer from "./image-slices/image-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    image: imageReducer,
  },
});
