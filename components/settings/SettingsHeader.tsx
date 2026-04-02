// src/components/settings/SettingsHeader.tsx

import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface Props {
  isFetching: boolean;
  isSaving: boolean;
  isRefreshing: boolean;
  onSave: () => void;
}

export const SettingsHeader = ({ isFetching, isSaving, isRefreshing, onSave }: Props) => (
  <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
    <Text className="text-lg font-bold text-[#2C64B3]">
      Configure Tiles
    </Text>

    <View className="flex-row items-center gap-x-3">
      {(isFetching || isRefreshing) && !isSaving && (
        <ActivityIndicator size="small" color="#2C64B3" />
      )}

      <TouchableOpacity
        className={`bg-[#2C64B3] px-5 py-2.5 rounded-lg min-w-[130px] items-center justify-center ${
          isSaving || isFetching || isRefreshing ? "opacity-60" : ""
        }`}
        onPress={onSave}
        disabled={isSaving || isFetching || isRefreshing}
        activeOpacity={0.8}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-sm">Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);