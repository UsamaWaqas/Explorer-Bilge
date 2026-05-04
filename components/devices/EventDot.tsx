import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EventDotProps {
  color: string;
  size?: number;
}

export default function EventDot({ color, size = 20 }: EventDotProps) {
  return (
    <View style={{ justifyContent: "center", alignItems: "center", height: 32, width: 32 }}>
      <Ionicons
        name="globe-outline"
        size={size}
        color={color}
      />
    </View>
  );
}