// src/components/settings/TileList.tsx

import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { TileItem } from "../../types/settings.types";
import { TileListItem } from "./TileListItem";

interface Props {
  productData: TileItem[];
  isFetching: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggle: (item: TileItem) => void;
  isAttributeDisabled: (item: TileItem) => boolean;
}

export const TileList = ({
  productData,
  isFetching,
  isRefreshing,
  onRefresh,
  onToggle,
  isAttributeDisabled,
}: Props) => {
  if (isFetching && productData.length === 0) {
    return (
      <View className="flex-1 justify-center items-center gap-y-3">
        <ActivityIndicator size="large" color="#2C64B3" />
        <Text className="text-gray-400 text-sm">Loading tiles...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="p-4 pb-8"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#2C64B3"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-white rounded-md overflow-hidden border border-gray-200 shadow-sm">
        {productData.length === 0 ? (
          <View className="py-10 items-center">
            <Text className="text-gray-400 text-sm">No tiles available</Text>
          </View>
        ) : (
          productData.map((item, index) => (
            <TileListItem
              key={`${item.productId}-${item.id}-${String(item.isProduct)}`}
              item={item}
              isLast={index === productData.length - 1}
              disabled={isAttributeDisabled(item)}
              isFetching={isFetching}
              isRefreshing={isRefreshing}
              onToggle={onToggle}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};