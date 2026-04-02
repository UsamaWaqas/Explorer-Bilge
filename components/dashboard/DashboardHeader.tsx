// src/components/dashboard/DashboardHeader.tsx

import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface Props {
  deviceLabel: string;
  isArmed: boolean;
}

export const DashboardHeader = ({ deviceLabel, isArmed }: Props) => (
  <View className="flex-row border-t border-white items-center bg-[#2C64B3] justify-between px-4 py-3">
    <View className="flex-row items-center flex-1 mr-3">
      <Ionicons name="boat" size={32} color="#fff" />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className="text-white text-xl font-bold ml-3 flex-1"
      >
        {deviceLabel}
      </Text>
    </View>
    <View className={`rounded-md px-6 py-3 ${isArmed ? "bg-red-600" : "bg-green-600"}`}>
      <Text className="text-white font-bold">
        {isArmed ? "ARMED" : "DISARMED"}
      </Text>
    </View>
  </View>
);