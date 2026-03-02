"use client"
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice/auth";

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
})