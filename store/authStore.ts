import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { REFRESH_TOKEN_KEY, TOKEN_KEY, USER_KEY } from "@/constants/storage";
import { AuthState, UserDetail } from "../types/ auth.types";

const USER_DETAIL_KEY = "userDetail";

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  userDetail: null,        // ← add kiya
  loading: true,

  login: async ({ token, refreshToken, user }) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      set({ token, refreshToken, user });
    } catch (error) {
      console.log("Login Error", error);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(USER_DETAIL_KEY);

      set({ token: null, refreshToken: null, user: null, userDetail: null });
    } catch (error) {
      console.log("Logout Error", error);
    }
  },

  initializeAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_KEY);
      const userDetailData = await SecureStore.getItemAsync(USER_DETAIL_KEY);  // ← add kiya

      set({
        token,
        refreshToken,
        user: userData ? JSON.parse(userData) : null,
        userDetail: userDetailData ? JSON.parse(userDetailData) : null,  // ← add kiya
      });
    } catch (error) {
      console.log("Auth Init Error", error);
    }
  },

  setToken: async (token: string) => {
    set({ token });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  // ← naya method
  setUserDetail: async (detail: UserDetail) => {
    try {
      await SecureStore.setItemAsync(USER_DETAIL_KEY, JSON.stringify(detail));
      set({ userDetail: detail });
    } catch (error) {
      console.log("SetUserDetail Error", error);
    }
  },
}));