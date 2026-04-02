import { useNetworkStore } from "@/store/networkStore";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/ToastConfig";
import { StatusBar } from "expo-status-bar";
import { Colors } from "../assets/Color";
import '../reactotronConfig';
import "./global.css";

export default function RootLayout() {
  const init = useNetworkStore((s) => s.init);
  const teardown = useNetworkStore((s) => s.teardown);

  useEffect(() => {
    init();
    return () => teardown();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.light.background} />
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
    </SafeAreaProvider>
  );
}