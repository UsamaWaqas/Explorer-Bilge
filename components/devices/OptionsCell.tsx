import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { OptionsCellProps } from "../../types/UserDevices.types";
import SensorReportModal from "./SensorReportModal";

export default function OptionsCell({ row, onSettingsPress }: OptionsCellProps) {
  const [sensorModalVisible, setSensorModalVisible] = useState(false);
  const router = useRouter();

  return (
    <>
      <View className="" style={{ flexDirection: "row", gap: 8, alignItems: "center", }}>

        {/* Warning — navigates to Events tab */}
        <Pressable onPress={() => router.push("/(tabs)/events")}>
          <MaterialIcons name="warning" size={18} color="#ef4444" />
        </Pressable>

        {/* Sensor Report */}
        <Pressable onPress={() => setSensorModalVisible(true)}>
          <MaterialIcons name="query-stats" size={18} color="#2563eb" />
        </Pressable>

        {/* Settings */}
        <Pressable onPress={() => onSettingsPress(row)}>
          <Ionicons name="settings-outline" size={18} color="#111827" />
        </Pressable>
      </View>

      <SensorReportModal
        visible={sensorModalVisible}
        onClose={() => setSensorModalVisible(false)}
        device_id={row.device_id}
      />
    </>
  );
}