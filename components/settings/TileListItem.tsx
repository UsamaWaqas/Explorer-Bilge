// src/components/settings/TileListItem.tsx

import { Text, View } from "react-native";
import AnimatedSwitch from "../Switch";
import { TileItem } from "../../types/settings.types";

interface Props {
  item: TileItem;
  isLast: boolean;
  disabled: boolean;
  isFetching: boolean;
  isRefreshing: boolean;
  onToggle: (item: TileItem) => void;
}

export const TileListItem = ({
  item,
  isLast,
  disabled,
  isFetching,
  isRefreshing,
  onToggle,
}: Props) => (
  <View
    key={`${item.productId}-${item.id}-${String(item.isProduct)}`}
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

    <View className={disabled || isFetching || isRefreshing ? "opacity-40" : ""}>
      <AnimatedSwitch
        value={item.isSelected}
        onValueChange={() => {
          if (disabled || isFetching || isRefreshing) return;
          onToggle(item);
        }}
      />
    </View>
  </View>
);