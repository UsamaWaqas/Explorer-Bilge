// src/screens/Dashboard.tsx

import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
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
    selectedDevice,
    deviceOptions,
    handleDeviceChange,
    tilesConfig,
    alertCount,
    isArmed,
    weatherData,
    formatTime,
    tides,
  } = useDashboard();

  const isMarina = selectedDevice?.raw?.where_from === "marina";

  return (
    <View className="flex-1 bg-gray-50">

      {/* Header */}
      <DashboardHeader
        deviceLabel={selectedDevice?.label ?? "Loading..."}
        isArmed={isArmed}
      />

      {loadingDevices ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          className="flex-1 bg-white px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        >
          {/* CURRENT CONDITIONS */}
          <View className="flex-row items-center gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-[#2563EB] text-base font-bold tracking-wide">
                CURRENT CONDITIONS
              </Text>
              {/* Device name + location */}
              {selectedDevice && (
                <View className="flex-row items-center gap-1 mt-0.5">
                  <Ionicons name="location-sharp" size={13} color="#16a34a" />
                  <Text className="text-gray-600 text-xs font-medium">
                    {selectedDevice.label}
                    {selectedDevice.raw?.device_location
                      ? `, ${selectedDevice.raw.device_location}`
                      : ""}
                  </Text>
                </View>
              )}
            </View>
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

          {/* Weather Tiles */}
          <View className="mb-6">
            <WeatherSection
              weatherData={weatherData}
              loadingWeather={loadingWeather}
              formatTime={formatTime}
              isMarina={isMarina}
              tides={tides}
              loadingTides={loadingTides}
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