import { post } from "../api/apiHelper";
import { useAuthStore } from "../store/authStore";

export const loginService = async (email: string, password: string) => {
  const response = await post(
    '/api/users/login',
    { email, password },
    {},
    false // 👈 helper ka toast band — Login.tsx khud handle karega
  );

  // ✅ Offline check — api call hi mat karo
  if (response?.isOffline) {
    return { success: false, isOffline: true, message: 'No internet connection' };
  }

  if (response?.error) {
    return { success: false, message: response.message };
  }

  const token = response?.data?.token;
  const user = response?.data?.user;

  if (token && user) {
    await useAuthStore.getState().login({
      token,
      refreshToken: token,
      user,
    });
    return { success: true };
  }

  return { success: false, message: "Login failed" };
};

export const logoutService = async () => {
  await useAuthStore.getState().logout();
};