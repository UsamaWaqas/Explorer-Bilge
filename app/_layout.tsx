import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import 'expo-dev-client';

import { useNetworkStore } from "@/store/networkStore";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Colors } from "../assets/Color";
import { toastConfig } from "../components/ToastConfig";
import { usePusherInit } from '../hooks/usePusher';
import '../reactotronConfig';
import "./global.css";



const queryClient = new QueryClient();

function AppContent() {
  const init = useNetworkStore((s) => s.init);
  const teardown = useNetworkStore((s) => s.teardown);

  useEffect(() => {
    init();
    return () => teardown();
  }, []);

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

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
        <PusherProvider>
          <AppContent />
        </PusherProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}