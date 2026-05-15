import { post } from "../api/apiHelper";
import { useAuthStore } from "../store/authStore";
import Toast from "react-native-toast-message";

export const loginService = async (email: string, password: string) => {
  const response = await post(
    "/api/users/login",
    { email, password },
    {},
    true,
  );
  console.log("Login Service Response:", response);

  if (response?.isOffline) {
    return {
      success: false,
      isOffline: true,
      message: "No internet connection",
    };
  }

  if (response?.error) {
    Toast.show({
      type: "error",
      text1: "Login Failed",
      text2: response.message || "Something went wrong",
      position: "top",
      visibilityTime: 3000,
    });
    return { success: false, message: response.message };
  }

  const message = response?.message;
  const data = response?.data;

  // ── success ──────────────────────────────────────────────────────────────
  if (message === "success") {
    const token = data?.token;
    const euid = data?.euid;
    const user = data?.user;
    const userDetail = data?.userDetail;

    if (token && user) {
      await useAuthStore.getState().login({
        token,
        user: { ...user, euid },
        userDetail: {
          ...userDetail,
          email_notification: !!userDetail?.email_notification,
          phone_notification: !!userDetail?.phone_notification,
        },
      });

      Toast.show({
        type: "success",
        text1: "Logged in Successfully",
        text2: "Welcome to myARMIT! 👋",
        position: "top",
        visibilityTime: 3000,
      });

      return { success: true };
    }
  }

  // ── incomplete profile ────────────────────────────────────────────────────
  if (message === "failed_profile") {
    Toast.show({
      type: "info",
      text1: "Profile Incomplete",
      text2: "Please complete your profile first",
      position: "top",
      visibilityTime: 3000,
    });
    return { success: false, reason: "failed_profile", userId: data };
  }

  // ── email not verified ────────────────────────────────────────────────────
  if (message === "not_verified") {
    Toast.show({
      type: "info",
      text1: "Email Not Verified",
      text2: "Please verify your email first",
      position: "top",
      visibilityTime: 3000,
    });
    return { success: false, reason: "not_verified" };
  }

  // ── device not activated ──────────────────────────────────────────────────
  if (message === "failed_device") {
    Toast.show({
      type: "info",
      text1: "Device Not Activated",
      text2: "Please activate your device first",
      position: "top",
      visibilityTime: 3000,
    });
    return { success: false, reason: "failed_device", userId: data };
  }

  // ── user doesn't exist ────────────────────────────────────────────────────
  if (message === "failed") {
    Toast.show({
      type: "error",
      text1: "Account Not Found",
      text2: "User doesn't exist, please create an account",
      position: "top",
      visibilityTime: 3000,
    });
    return { success: false, reason: "failed" };
  }

  // ── fallback ──────────────────────────────────────────────────────────────
  Toast.show({
    type: "error",
    text1: "Login Failed",
    text2: message || "Something went wrong",
    position: "top",
    visibilityTime: 3000,
  });
  return { success: false, message };
};

export const logoutService = async () => {
  await useAuthStore.getState().logout();
};