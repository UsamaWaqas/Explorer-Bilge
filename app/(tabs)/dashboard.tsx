import { Ionicons } from "@expo/vector-icons";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomDropdown from "../../components/Select";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton";
import { MonitoringSection } from "../../components/dashboard/MonitoringSection";
import { WeatherSection } from "../../components/dashboard/WeatherSection";
import { useDashboard } from "../../hooks/useDashboard";

export default function Dashboard() {
  const insets = useSafeAreaInsets();

  const {
    loadingDevices,
    loadingWeather,
    loadingMonitoring,
    loadingTides,
    isRefreshing,
    onRefresh,
    selectedDevice,
    deviceOptions,
    handleDeviceChange,
    tilesConfig,
    alertCount,
    isArmed,
    weatherData,
    formatTime,
    tides,
    isMarina,
    isMarinaWithLocation,
  } = useDashboard();

  console.log("[Dashboard render] label:", selectedDevice?.label);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <DashboardHeader
        deviceLabel={selectedDevice?.label ?? "Loading..."}
        isArmed={isArmed}
        whereFrom={selectedDevice?.raw?.where_from}
      />

      {loadingDevices ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          className="flex-1 bg-white px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#2C64B3"
            />
          }
        >
          {/* CURRENT CONDITIONS */}
          <View className="mb-3">
            {/* Title + Dropdown row */}
            <View className="flex-row items-center gap-3">
              <Text className="text-[#2C64B3] text-base font-bold tracking-wide flex-1">
                CURRENT CONDITIONS
              </Text>
              <View style={{ width: 150 }}>
                <CustomDropdown
                  data={deviceOptions}
                  value={selectedDevice?.value ?? null}
                  onChange={handleDeviceChange}
                  label="Select Device"
                  compact
                  disabled={loadingWeather || loadingMonitoring}
                />
              </View>
            </View>

            {/* Location row - full width, below the title/dropdown row */}
            {selectedDevice && (
              <View className="flex-row items-center gap-1 mt-0.5">
                <Ionicons name="location-sharp" size={13} color="#16a34a" />
                <Text
                  className="text-gray-600 text-xs font-medium flex-1"
                  numberOfLines={2}
                >
                  {selectedDevice.label}
                  {selectedDevice.raw?.device_location
                    ? `, ${selectedDevice.raw.device_location}`
                    : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Weather Tiles */}
          <View className="mb-6">
            <WeatherSection
              weatherData={weatherData}
              loadingWeather={loadingWeather}
              formatTime={formatTime}
              isMarina={isMarina}
              tides={isMarinaWithLocation ? tides : undefined}
              loadingTides={isMarinaWithLocation ? loadingTides : false}
            />
          </View>

          {/* Monitoring Tiles */}
          <MonitoringSection
            tilesConfig={tilesConfig}
            alertCount={alertCount}
            loadingMonitoring={loadingMonitoring}
          />
        </ScrollView>
      )}
    </View>
  );
}