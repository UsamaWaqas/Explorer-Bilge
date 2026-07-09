import * as Device from "expo-device";
// import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { post } from "../api/apiHelper";
import { useAuthStore } from "../store/authStore";

export function usePushToken() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    async function registerPushToken() {
      if (!Device.isDevice) {
        console.log("[FCM] Not a physical device — skipping");
        return;
      }

      // const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("[FCM] Permission not granted:", status);
        return;
      }

      try {
        // const token = await Notifications.getDevicePushTokenAsync();
        console.log("====================================");
        // console.log("[FCM TOKEN]:", token.data);
        console.log("====================================");

        await post(
          "/api/user/push-token",
          {
            // token: token.data,
            platform: Platform.OS,
            userId: (user as any)?.id,
          },
          {},
          false,
        );

        console.log("[FCM] Token sent to backend successfully");
      } catch (err) {
        console.error("[FCM ERROR]:", err);
      }
    }

    if (user) registerPushToken();
  }, [user]);
}
