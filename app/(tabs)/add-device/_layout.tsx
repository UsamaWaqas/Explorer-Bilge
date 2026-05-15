import { Stack } from "expo-router";

export default function AddDeviceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right", 
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="step-two/[id]" />
      <Stack.Screen name="step-three/[id]" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="success" />
    </Stack>
  );
}