import 'expo-dev-client';

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

const SAFE_ROUTES = [
  "/(tabs)/dashboard",
  "/(tabs)/devices",
  "/(tabs)/add",
  "/(tabs)/events",
  "/(tabs)/settings",
];

const isHermes = () => !!(global as any).HermesInternal;
console.log("Is Hermes enabled?", isHermes());

export default function Index() {
  const router = useRouter();
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    Promise.all([
      initializeAuth(),
      AsyncStorage.getItem("lastRoute"),
    ]).then(([_, lastRoute]) => {
      const token = useAuthStore.getState().token;

      if (token) {
    
        const safeRoute = SAFE_ROUTES.includes(lastRoute as string)
          ? lastRoute
          : "/(tabs)/dashboard";
        router.replace(safeRoute as any);
      } else {
        router.replace("/(auth)/Login");
      }
    });
  }, []);

  return null;
}