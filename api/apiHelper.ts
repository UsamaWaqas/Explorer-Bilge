import Toast from "react-native-toast-message";
import axiosInstance from "./axiosConfig";

const handleApiError = (error: any) => {
  if (error?.isOffline) {
    return {
      error: true,
      isOffline: true,
      message: "No internet connection",
    };
  }

  console.log("API Error:", error);
  return {
    error: true,
    message: error?.response?.data?.message || "Something went wrong",
  };
};

const showToastMessage = (
  type: "success" | "error" | "info",
  message: string,
) => {
  Toast.show({
    type,
    text1:
      type === "success" ? "Success" : type === "info" ? "Offline" : "Error",
    text2: message,
    position: "top",
    visibilityTime: 3000,
  });
};

async function get(url: string, params: any = {}) {
  try {
    const response = await axiosInstance.get(url, { params });
    return response.data;
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function post(
  url: string,
  data: any = {},
  config: any = {},
  showToast: boolean = true,
) {
  try {
    const response = await axiosInstance.post(url, data, config);

 
    if (response?.data?.success === false) {
      if (showToast) {
        const message = response?.data?.message || "Something went wrong";
        showToastMessage("error", message);
      }
      return { error: true, message: response?.data?.message };
    }

    if (showToast) {
      const message = response?.data?.message || "Successfully completed!";
      showToastMessage("success", message);
    }
    return response?.data || handleApiError(new Error("Unexpected error"));
  } catch (error: any) {
    if (error?.isOffline) {
      showToastMessage(
        "info",
        "You are offline. Please check your connection.",
      );
      return handleApiError(error);
    }
    if (showToast) {
      const message = error?.response?.data?.message || "Something went wrong";
      showToastMessage("error", message);
    }
    return handleApiError(error);
  }
}

async function put(
  url: string,
  data: any = {},
  config: any = {},
  showToast: boolean = true,
) {
  try {
    const response = await axiosInstance.put(url, data, config);


    if (response?.data?.success === false) {
      if (showToast) {
        const message = response?.data?.message || "Update failed";
        showToastMessage("error", message);
      }
      return { error: true, message: response?.data?.message };
    }

    if (showToast) {
      const message = response?.data?.message || "Successfully updated!";
      showToastMessage("success", message);
    }
    return response?.data || handleApiError(new Error("Unexpected error"));
  } catch (error: any) {
    if (error?.isOffline) {
      showToastMessage(
        "info",
        "You are offline. Please check your connection.",
      );
      return handleApiError(error);
    }
    if (showToast) {
      const message = error?.response?.data?.message || "Update failed";
      showToastMessage("error", message);
    }
    return handleApiError(error);
  }
}

async function del(url: string, config: any = {}, showToast: boolean = true) {
  try {
    const response = await axiosInstance.delete(url, config);

    if (response?.data?.success === false) {
      if (showToast) {
        const message = response?.data?.message || "Delete failed";
        showToastMessage("error", message);
      }
      return { error: true, message: response?.data?.message };
    }

    if (showToast) {
      const message = response?.data?.message || "Successfully deleted!";
      showToastMessage("success", message);
    }
    return response?.data || handleApiError(new Error("Unexpected error"));
  } catch (error: any) {
    if (error?.isOffline) {
      showToastMessage(
        "info",
        "You are offline. Please check your connection.",
      );
      return handleApiError(error);
    }
    if (showToast) {
      const message = error?.response?.data?.message || "Delete failed";
      showToastMessage("error", message);
    }
    return handleApiError(error);
  }
}

export { del, get, post, put };
