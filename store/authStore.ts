import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { TOKEN_KEY, USER_KEY } from "@/constants/storage";
import { AuthState, UserDetail } from "../types/ auth.types";

const USER_DETAIL_KEY = "userDetail";

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  userDetail: null,
  loading: true,

  login: async ({ token, user, userDetail }) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      await SecureStore.setItemAsync(
        USER_DETAIL_KEY,
        JSON.stringify(userDetail),
      );
      set({ token, user, userDetail });
    } catch (error) {
      console.log("Login Error", error);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(USER_DETAIL_KEY);
      set({ token: null, user: null, userDetail: null });
    } catch (error) {
      console.log("Logout Error", error);
    }
  },

  initializeAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_KEY);
      const userDetailData = await SecureStore.getItemAsync(USER_DETAIL_KEY);
      console.log(token, userData, userDetailData);

      set({
        token,
        user: userData ? JSON.parse(userData) : null,
        userDetail: userDetailData ? JSON.parse(userDetailData) : null,
        loading: false,
      });
    } catch (error) {
      console.log("Auth Init Error", error);
      set({ loading: false });
    }
  },

  setToken: async (token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      set({ token });
    } catch (error) {
      console.log("SetToken Error", error);
    }
  },

  setUserDetail: async (detail: Partial<UserDetail>) => {
    try {
      const existing = get().userDetail;
      const merged = existing
        ? { ...existing, ...detail }
        : (detail as UserDetail);

      await SecureStore.setItemAsync(USER_DETAIL_KEY, JSON.stringify(merged));
      set({ userDetail: merged });
    } catch (error) {
      console.log("SetUserDetail Error", error);
    }
  },
}));
