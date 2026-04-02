import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";
import AnimatedArmItLogo from "../components/AnimatedArmItLogo";
import * as SplashScreen from "expo-splash-screen"; // ✅ import karo

SplashScreen.preventAutoHideAsync(); // ✅ bahar rakho component se

export default function Index() {
  const router = useRouter();
  const { initializeAuth } = useAuthStore();

  const animationDone = useRef(false);
  const authDone = useRef(false);
  const hasNavigated = useRef(false);
  const resolvedData = useRef<{
    token: string | null;
    lastRoute: string | null;
  }>({ token: null, lastRoute: null });

  const navigate = () => {
    if (hasNavigated.current) return;
    if (!animationDone.current || !authDone.current) return;

    hasNavigated.current = true;
    const { token, lastRoute } = resolvedData.current;

    if (token) {
      router.replace((lastRoute as any) || "/(tabs)/dashboard");
    } else {
      router.replace("/(auth)/Login");
    }
  };

  useEffect(() => {
    SplashScreen.hideAsync(); // ✅ Expo splash turant hide karo

    Promise.all([
      initializeAuth(),
      AsyncStorage.getItem("lastRoute"),
    ]).then(([_, lastRoute]) => {
      const token = useAuthStore.getState().token;
      resolvedData.current = { token, lastRoute };
      authDone.current = true;
      navigate();
    });
  }, []);

  return (
    <SafeAreaView className="bg-white flex-1">
      <View className="flex-1 justify-center items-center">
        <AnimatedArmItLogo
          width={200}
          height={69}
          totalDuration={2500}
          onAnimationEnd={() => {
            animationDone.current = true;
            navigate();
          }}
        />
      </View>
      <StatusBar barStyle="light-content" backgroundColor="#2b2b2b" />
    </SafeAreaView>
  );
}