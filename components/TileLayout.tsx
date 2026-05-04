// src/components/TileLayout.tsx

import React from "react";
import { Text, View, ViewStyle } from "react-native";

interface TileLayoutProps {
  title?: string;
  value?: string;
  Icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

const TileLayout = ({
  title = "",
  value = "",
  Icon = null,
  children,
  style,
}: TileLayoutProps) => {
  
  const safeValue =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : "NA";


  const safeTitle =
    typeof title === "string" || typeof title === "number"
      ? String(title)
      : "";

  const isDark = safeValue === "Alert";

  return (
    <View
      style={[
        {
          height: 100,
          paddingHorizontal: 8,
          paddingVertical: 2,
          width: "100%",
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 6,
          backgroundColor: isDark ? "#2c64b3" : "#F9FAFB",
          justifyContent: "center",
        },
        
        typeof style === "object" && !React.isValidElement(style)
          ? style
          : undefined,
      ]}
    >
      {children ? (
        <View className="flex-1 justify-center-center">
          <Text
            className={`text-sm font-bold text-center mb-2 w-full ${
              isDark ? "text-white" : "text-gray-500"
            }`}
          >
            {safeTitle}
          </Text>
          {children}
        </View>
      ) : (
        <View className="flex-row items-center justify-between w-full">
          <View className="mt-2 ml-[2px]">
          
            {React.isValidElement(Icon) ? Icon : null}
          </View>
          <View className="flex-col items-center basis-[70%] gap-3 pr-2">
            <Text
              className={`text-base text-center font-bold -mt-2 ${
                isDark ? "text-white" : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {safeTitle}
            </Text>
            <Text
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {safeValue}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default TileLayout;