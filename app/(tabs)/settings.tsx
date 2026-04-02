// src/screens/Settings.tsx

import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SettingsHeader } from "../../components/settings/SettingsHeader"
import { TileList } from "../../components/settings/TileList";
import { useSettings } from "../../hooks/useSettings";

export default function Settings() {
  const {
    productData,
    isFetching,
    isSaving,
    isRefreshing,
    onRefresh,
    toggleSwitch,
    handleSave,
    isAttributeDisabled,
  } = useSettings();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <View className="flex-1 bg-blue-50/30">

        {/* Header */}
        <SettingsHeader
          isFetching={isFetching}
          isSaving={isSaving}
          isRefreshing={isRefreshing}
          onSave={handleSave}
        />

        {/* Body */}
        <TileList
          productData={productData}
          isFetching={isFetching}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onToggle={toggleSwitch}
          isAttributeDisabled={isAttributeDisabled}
        />

      </View>
    </SafeAreaView>
  );
}