import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, StatusBar, Text, View } from "react-native";
import { useDrawerStore } from "../store/ModalStore";
import ArmITLogo from "../assets/images/armIT_logo.svg";
import BurgerIcon from "../assets/svg/Burger.svg";
import Ionicon from "../assets/svg/lock.svg";
import WhiteBell from "../assets/Icons/WhiteBell";
import GreenBell from "../assets/Icons/GreenBell";

export default function Header() {
  const open = useDrawerStore((s) => s.open);
  const pathname = usePathname();
  const [bellActive, setBellActive] = useState(false);

  // Jab settings se bahar jao to green hat jaye
  useEffect(() => {
    if (!pathname.includes("settings")) {
      setBellActive(false);
    }
  }, [pathname]);

  const handleBellPress = () => {
    setBellActive(true);
    router.push("/(tabs)/settings");
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C64B3" />

      <View className="bg-[#2C64B3]">
        <View className="flex-row items-center p-2 justify-between">
          <View className="flex-row items-center flex">
            <View className="flex-row items-center bg-white/10 rounded-md px-4 py-2">
              <Ionicons name="location" size={16} color="white" />
              <Text className="text-white text-sm ml-1">Lahore</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="items-center mr-4">
              <ArmITLogo width={120} fill="#FFF" height={40} />
            </View>
            <Pressable className="mr-3">
              <Ionicon width={22} height={40} />
            </Pressable>

            {/* Bell - sirf click par green, settings navigate */}
            <Pressable className="mr-3" onPress={handleBellPress}>
              {bellActive ? <GreenBell /> : <WhiteBell />}
            </Pressable>

            <Pressable onPress={open}>
              <BurgerIcon width={26} height={42} />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}