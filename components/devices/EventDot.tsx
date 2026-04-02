import React from "react";
import { View } from "react-native";

interface EventDotProps {
  color: string;
}

export default function EventDot({ color }: EventDotProps) {
  return (
    <View
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: color,
        alignSelf: "center",
      }}
    />
  );
}