import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StatusBar, Text, View } from "react-native";
import GreenBell from "../assets/Icons/GreenBell";
import WhiteBell from "../assets/Icons/WhiteBell";
import ArmITLogo from "../assets/images/armIT_logo.svg";
import BurgerIcon from "../assets/svg/Burger.svg";
import Ionicon from "../assets/svg/lock.svg";
import { useAuthStore } from "../store/authStore";
import { useDrawerStore } from "../store/ModalStore";

export default function Header() {
  const open = useDrawerStore((s) => s.open);
  const pathname = usePathname();
  const userDetail = useAuthStore((s) => s.userDetail);

  const bellActive = pathname.includes("configure-alerts");
  const location = userDetail?.address_1 ?? "Location";

  const handleBellPress = () => {
    router.push("/(tabs)/configure-alerts");
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C64B3" />

      <View className="bg-[#2C64B3]">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          {/* Location Badge — shrinks when name is long */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#C9D0D3",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 7,
              flexShrink: 1,       
              flexGrow: 0,
              minWidth: 80,       
              maxWidth: 180,      
              marginRight: 8,
            }}
          >
            <Ionicons
              name="location-sharp"
              size={16}
              color="#4B5563"
              style={{ flexShrink: 0 }} // icon never shrinks
            />
            <Text
              style={{
                color: "#4B5563",
                marginLeft: 4,
                fontSize: 12,
                fontWeight: "500",
                flexShrink: 1,     
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {location}
            </Text>
          </View>

          {/* Right Side Icons — never shrinks or wraps */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,       
              marginLeft: "auto",  
            }}
          >
            <ArmITLogo width={90} height={34} />

            <Pressable hitSlop={8}>
              <Ionicon width={22} height={32} />
            </Pressable>

            <Pressable onPress={handleBellPress} hitSlop={8}>
              {bellActive ? <GreenBell /> : <WhiteBell />}
            </Pressable>

            <Pressable onPress={open} hitSlop={8}>
              <BurgerIcon width={24} height={32} />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}