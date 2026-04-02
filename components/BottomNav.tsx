import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Allowed tabs
 */
type Tab = "dashboard" | "devices" | "events" | "settings";

export default function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  /**
   * Detect active tab from current route
   */
  const activeTab: Tab =
    pathname.startsWith("/devices")
      ? "devices"
      : pathname.startsWith("/events")
      ? "events"
      : pathname.startsWith("/settings")
      ? "settings"
      : "dashboard";

  /**
   * Navigate on tab press
   */
  const handleTabPress = (tab: Tab) => {
    router.push(`/${tab}` as any);
  };

  /**
   * Helper for icon wrapper
   */
  const iconWrapper = (tab: Tab) =>
    `items-center justify-center w-10 h-10 mb-1 ${
      activeTab === tab ? "bg-[#2563EB] rounded-lg" : ""
    }`;

  /**
   * Helper for label
   */
  const labelStyle = (tab: Tab) =>
    `text-xs ${
      activeTab === tab
        ? "text-[#2563EB] font-semibold"
        : "text-[#9CA3AF]"
    }`;

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex-row items-center justify-around pt-2 shadow-lg"
      style={{ paddingBottom: insets.bottom + 8 }}
    >
      {/* Dashboard */}
      <Pressable
        className="items-center py-2 px-3"
        onPress={() => handleTabPress("dashboard")}
      >
        <View className={iconWrapper("dashboard")}>
          <Ionicons
            name="grid"
            size={24}
            color={activeTab === "dashboard" ? "white" : "#9CA3AF"}
          />
        </View>
        <Text className={labelStyle("dashboard")}>Dashboard</Text>
      </Pressable>

      {/* Devices */}
      <Pressable
        className="items-center py-2 px-3"
        onPress={() => handleTabPress("devices")}
      >
        <View className={iconWrapper("devices")}>
          <Ionicons
            name="phone-portrait-outline"
            size={24}
            color={activeTab === "devices" ? "white" : "#9CA3AF"}
          />
        </View>
        <Text className={labelStyle("devices")}>Devices</Text>
      </Pressable>

      {/* Center Add Button */}
      <Pressable
        className="bg-[#22C55E] rounded-full p-4 -mt-10 shadow-lg"
        onPress={() => console.log("Add pressed")}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>

      {/* Events */}
      <Pressable
        className="items-center py-2 px-3"
        onPress={() => handleTabPress("events")}
      >
        <View className={iconWrapper("events")}>
          <Ionicons
            name="calendar-outline"
            size={24}
            color={activeTab === "events" ? "white" : "#9CA3AF"}
          />
        </View>
        <Text className={labelStyle("events")}>Events</Text>
      </Pressable>

      {/* Settings */}
      <Pressable
        className="items-center py-2 px-3"
        onPress={() => handleTabPress("settings")}
      >
        <View className={iconWrapper("settings")}>
          <Ionicons
            name="settings-outline"
            size={24}
            color={activeTab === "settings" ? "white" : "#9CA3AF"}
          />
        </View>
        <Text className={labelStyle("settings")}>Settings</Text>
      </Pressable>
    </View>
  );
}
