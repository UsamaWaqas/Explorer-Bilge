import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get } from "../../api/apiHelper";
import TemperatureChart from "./Temperaturechart";
import HumidityChart from "./Humiditychart";

interface SensorReportModalProps {
  visible: boolean;
  onClose: () => void;
  device_id: string | number;
}

type Interval = "daily" | "weekly" | "monthly";

interface SensorEntry {
  day?: string;
  week?: string;
  month?: string;
  temperature: number;
  humidity: number;
  luminosity: number;
}

interface ChartData {
  labels: string[];
  values: number[];
}

// ─── Cache Helpers ────────────────────────────────────────────────────────────

const CACHE_PREFIX = "sensor_report:";

async function saveToCache(key: string, data: SensorEntry[]) {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (_) {}
}

async function loadFromCache(key: string): Promise<SensorEntry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SensorReportModal({
  visible,
  onClose,
  device_id,
}: SensorReportModalProps) {
  const [selectedInterval, setSelectedInterval] = useState<Interval>("daily");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SensorEntry[]>([]);
  const [error, setError] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    if (!visible) return;
    fetchSensorData(selectedInterval);
  }, [visible, selectedInterval]);

  async function fetchSensorData(interval: Interval) {
    setLoading(true);
    setError(false);
    setIsFromCache(false);

    const cacheKey = `${interval}_${device_id}`;
    const result = await get(
      `/api/sensors/get-data-interval/${interval}/${device_id}`
    );

    if (result?.error) {
      if (result?.isOffline) {
        const cached = await loadFromCache(cacheKey);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }
      setError(true);
      setLoading(false);
      return;
    }

    const raw: SensorEntry[] = result?.data || [];
    const mapped = raw.map((item) => ({
      ...item,
      temperature: item.temperature ? Number(item.temperature.toFixed(2)) : 0,
      humidity: item.humidity ? Number(item.humidity.toFixed(2)) : 0,
      luminosity: item.luminosity ? Number(item.luminosity.toFixed(2)) : 0,
    }));

    await saveToCache(cacheKey, mapped);
    setData(mapped);
    setLoading(false);
  }

  const latest = data?.[data.length - 1];

  const getLabel = (item: SensorEntry): string => {
    if (selectedInterval === "daily") return item.day ?? "-";
    if (selectedInterval === "weekly") return `Week ${item.week ?? "-"}`;
    return item.month ?? "-";
  };

  const temperatureChartData: ChartData = {
    labels: data.map((item) => getLabel(item)),
    values: data.map((item) => item.temperature),
  };

  const humidityChartData: ChartData = {
    labels: data.map((item) => getLabel(item)),
    values: data.map((item) => item.humidity),
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />

        {/* Bottom Sheet */}
        <View
          className="bg-white rounded-t-3xl px-5 pt-4 pb-10"
          style={{ height: "90%" }}
        >
          {/* Drag Handle */}
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />

          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-bold text-gray-900">
              Sensor Report
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
          </View>

          {/* Offline Cache Banner */}
          {isFromCache && (
            <View className="flex-row items-center bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3 gap-1.5">
              <Ionicons name="cloud-offline-outline" size={14} color="#B45309" />
              <Text className="text-[11px] text-yellow-700 font-medium">
                Offline — showing cached data
              </Text>
            </View>
          )}

          {/* Interval Toggle */}
          <View className="flex-row bg-[#E3EFFF] rounded-lg p-1 mb-5">
            {(["daily", "weekly", "monthly"] as Interval[]).map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setSelectedInterval(opt)}
                className={`flex-1 py-1.5 rounded-md items-center ${
                  selectedInterval === opt ? "bg-[#2C64B3]" : ""
                }`}
              >
                <Text
                  className={`text-xs font-semibold capitalize ${
                    selectedInterval === opt ? "text-white" : "text-[#2C64B3]"
                  }`}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ScrollView always rendered */}
          <ScrollView showsVerticalScrollIndicator={false}>

            {loading ? (
              <ActivityIndicator
                color="#2C64B3"
                style={{ marginVertical: 80 }}
              />

            ) : error ? (
              <View className="items-center my-10 gap-2">
                <Ionicons name="cloud-offline-outline" size={36} color="#9CA3AF" />
                <Text className="text-center text-gray-400 text-sm">
                  You are offline and no cached data available.
                </Text>
              </View>

            ) : data.length === 0 ? (
              <View className="items-center my-10 gap-2">
                <Ionicons name="bar-chart-outline" size={36} color="#9CA3AF" />
                <Text className="text-center text-gray-400 text-sm">
                  No data available for this period.
                </Text>
              </View>

            ) : (
              <>
                {/* Latest Stats Cards */}
                <View className="flex-row gap-2 mb-5">
                  <View className="flex-1 bg-[#E3EFFF] rounded-xl p-3 items-center">
                    <Text className="text-[10px] text-gray-500 font-medium mb-1">
                      Temperature
                    </Text>
                    <Text className="text-base font-bold text-[#2C64B3]">
                      {latest ? `${latest.temperature}°` : "---"}
                    </Text>
                  </View>
                  <View className="flex-1 bg-[#E3EFFF] rounded-xl p-3 items-center">
                    <Text className="text-[10px] text-gray-500 font-medium mb-1">
                      Humidity
                    </Text>
                    <Text className="text-base font-bold text-[#2C64B3]">
                      {latest ? `${latest.humidity}%` : "---"}
                    </Text>
                  </View>
                  <View className="flex-1 bg-[#E3EFFF] rounded-xl p-3 items-center">
                    <Text className="text-[10px] text-gray-500 font-medium mb-1">
                      Luminosity
                    </Text>
                    <Text className="text-base font-bold text-[#2C64B3]">
                      {latest ? `${latest.luminosity}` : "---"}
                    </Text>
                  </View>
                </View>

                {/* Temperature Chart */}
                <View
                  className="rounded-xl bg-[#FAFAFA] p-3 mb-4"
                  style={{ minHeight: 340 }}
                >
                  <TemperatureChart
                    data={temperatureChartData}
                    yaxisTitle="Fahrenheit"
                  />
                </View>

                {/* Humidity Chart */}
                <View
                  className="rounded-xl bg-[#FAFAFA] p-3 mb-5"
                  style={{ minHeight: 290 }}
                >
                  <HumidityChart data={humidityChartData} />
                </View>

                {/* Data Table Header */}
                <View className="flex-row bg-gray-100 rounded-lg px-3 py-2 mb-1">
                  <Text className="flex-1 text-[11px] font-bold text-gray-600">
                    {selectedInterval === "daily"
                      ? "Day"
                      : selectedInterval === "weekly"
                      ? "Week"
                      : "Month"}
                  </Text>
                  <Text className="w-20 text-[11px] font-bold text-gray-600 text-center">
                    Temp (°)
                  </Text>
                  <Text className="w-20 text-[11px] font-bold text-gray-600 text-center">
                    Hum (%)
                  </Text>
                  <Text className="w-20 text-[11px] font-bold text-gray-600 text-center">
                    Lux
                  </Text>
                </View>

                {/* Data Table Rows */}
                {data.map((item, index) => (
                  <View
                    key={index}
                    className={`flex-row px-3 py-2 rounded-lg mb-0.5 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <Text className="flex-1 text-[11px] text-gray-700">
                      {getLabel(item)}
                    </Text>
                    <Text className="w-20 text-[11px] text-gray-700 text-center">
                      {item.temperature}
                    </Text>
                    <Text className="w-20 text-[11px] text-gray-700 text-center">
                      {item.humidity}
                    </Text>
                    <Text className="w-20 text-[11px] text-gray-700 text-center">
                      {item.luminosity}
                    </Text>
                  </View>
                ))}
              </>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
