import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import 'expo-dev-client';

// import * as Notifications from 'expo-notifications';
import { useNetworkStore } from "@/store/networkStore";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/ToastConfig";
import { usePusherInit } from '../hooks/usePusher';
import { usePushToken } from '../hooks/usePushToken';
import '../reactotronConfig';
import "./global.css";

// ── Notification handler setup ──────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//     shouldBanner: true,
//     shouldList: true,
//   }),
// });

(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.allowFontScaling = false;

const queryClient = new QueryClient();

function AppContent() {
  const init = useNetworkStore((s) => s.init);
  const teardown = useNetworkStore((s) => s.teardown);
  const router = useRouter();

  useEffect(() => {
    init();
    return () => teardown();
  }, []);

  // ── Listen for notification tap ────────────────────────────────────────
  // useEffect(() => {
    // const subscription = Notifications.addNotificationResponseReceivedListener(
    //   (response) => {
    //     const data = response.notification.request.content.data;

    //     // If notification has roomName, navigate to call screen
    //     if (data?.roomName) {
    //       router.push({
    //         pathname: '/(tabs)/call/[roomName]',
    //         params: {
    //           roomName: data.roomName as string,
    //           displayName: (data.callerName as string) || 'Caller',
    //           xnid: (data.callerXnid as string) || '',
    //         },
    //       });
    //     }
    //   }
    // );

  //   return () => subscription.remove();
  // }, [router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Toast
        config={toastConfig}
        position="top"
        topOffset={60}
        visibilityTime={3000}
      />
    </View>
  );
}

function PusherProvider({ children }: { children: React.ReactNode }) {
  usePusherInit();
  return <>{children}</>;
}

function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Register push token on app start
  usePushToken();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
          <PusherProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </PusherProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}