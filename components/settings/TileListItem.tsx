// src/components/settings/TileListItem.tsx

import { memo } from "react";
import { Text, View } from "react-native";
import AnimatedSwitch from "../Switch";
import { TileItem } from "../../types/settings.types";

interface Props {
  item: TileItem;
  isLast: boolean;
  disabled: boolean;
  
  onToggle: (item: TileItem) => void;
}

export const TileListItem = memo(
  ({ item, isLast, disabled, onToggle }: Props) => (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5
        ${!isLast ? "border-b border-gray-100" : ""}
        ${item.isProduct ? "bg-blue-50/60" : "bg-white"}
      `}
    >
      <Text
        className={`flex-1 mr-3
          ${item.isProduct
            ? "text-[#2C64B3] font-bold text-base"
            : "text-gray-500 font-medium text-sm pl-2"
          }
          ${disabled ? "opacity-40" : ""}
        `}
      >
        {item.name}
      </Text>

            <View className={disabled ? "opacity-40" : ""}>
        <AnimatedSwitch
          value={item.isSelected}
          onValueChange={() => {
            if (disabled) return;
            onToggle(item);
          }}
        />
      </View>
    </View>
  ),

  
  (prev, next) =>
    prev.item.isSelected === next.item.isSelected &&
    prev.item.id === next.item.id &&
    prev.item.productId === next.item.productId &&
    prev.disabled === next.disabled &&
    prev.isLast === next.isLast,
);

TileListItem.displayName = "TileListItem";