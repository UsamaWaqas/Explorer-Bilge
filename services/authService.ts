import { post } from "../api/apiHelper";
import { useAuthStore } from "../store/authStore";
import Toast from "react-native-toast-message";

export const loginService = async (email: string, password: string) => {
  const response = await post(
    "/api/users/login",
    { email, password },
    {},
    false,
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
    return { success: false, message: response.message };
  }

  const token = response?.data?.token;
  const euid = response?.data?.euid; // ← euid extract karo
  const user = response?.data?.user;
  const userDetail = response?.data?.userDetail;
  console.log("Login Response:", response.data.userDetail);

  if (token && user) {
    await useAuthStore.getState().login({
      token,
      user: {
        ...user,
        euid,
      },
      userDetail,
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

  return { success: false, message: "Login failed" };
};

export const logoutService = async () => {
  await useAuthStore.getState().logout();
};