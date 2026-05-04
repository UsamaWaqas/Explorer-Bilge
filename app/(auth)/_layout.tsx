import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuthLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          // animationDuration: 250,
        }}
      />
    </View>
  );
}