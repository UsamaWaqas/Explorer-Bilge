import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { STORAGE_KEYS } from "../constants/keys";
import { getDeviceDetails, getDevicesList } from "../services/deviceService";
import {
  Device,
  DeviceOption,
  MonitoringCache,
  TidesCache,
} from "../types/dashboard.types";
import { loadData, removeData, saveData } from "../utils/asyncStorage";
import {
  formatTideTime,
  getTilesConfig,
  haversineDistance,
} from "../utils/XupTileData";
import { useNetwork } from "./useNetwork";
import { usePusherEvent } from "./usePusher";
import { useWeather } from "./useWeather";

export const useDashboard = () => {
  const queryClient = useQueryClient();
  const { isConnected } = useNetwork();
  const isConnectedRef = useRef(isConnected);
  const previousDeviceRef = useRef<DeviceOption | null>(null);

  const [selectedDevice, setSelectedDevice] = useState<DeviceOption | null>(
    null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedDeviceRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    selectedDeviceRef.current = selectedDevice?.value;
    console.log(
      "[Dashboard] selectedDevice ref updated:",
      selectedDevice?.value,
    );
  }, [selectedDevice?.value]);

  usePusherEvent(() => {
    queryClient.invalidateQueries({
      queryKey: ["monitoring", selectedDeviceRef.current],
    });
  });

  const { weatherData, loadingWeather, fetchWeather, formatTime } =
    useWeather();

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    if (isConnected === false) {
      Toast.show({
        type: "info",
        text1: "Offline",
        text2: "No internet connection",
        position: "top",
        visibilityTime: 3000,
      });
    }
  }, [isConnected]);

  // ── Focus Refetch ──────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      console.log(
        "[Focus] fired, device:",
        selectedDeviceRef.current,
        "connected:",
        isConnectedRef.current,
      );

      if (!isConnectedRef.current) return;

      queryClient.invalidateQueries({ queryKey: ["devices"] });

      if (selectedDeviceRef.current) {
        queryClient.invalidateQueries({
          queryKey: ["monitoring", selectedDeviceRef.current],
        });
      }
    }, []),
  );

  // ── onRefresh ──────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    if (!isConnectedRef.current) {
      Toast.show({
        type: "info",
        text1: "Offline",
        text2: "No internet connection",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["devices"] }),
      queryClient.invalidateQueries({
        queryKey: ["monitoring", selectedDevice?.value],
      }),
      queryClient.invalidateQueries({
        queryKey: ["tides", selectedDevice?.value],
      }),
    ]);
    setIsRefreshing(false);
  }, [selectedDevice?.value]);

  // ── 1. Devices ─────────────────────────────────────────
  const { data: deviceOptions = [], isLoading: loadingDevices } = useQuery<
    DeviceOption[]
  >({
    queryKey: ["devices"],
    queryFn: async () => {
       console.log("[Devices] queryFn called!"); 
      if (!isConnectedRef.current) {
        const cached = await loadData<DeviceOption[]>(STORAGE_KEYS.DEVICES, []);
        return cached;
      }

      const result = await getDevicesList();
        console.log("[Devices] API response:", JSON.stringify(result.data.map((d: Device) => d.device_name)));

      console.log(
        "[Devices] raw device object:",
        JSON.stringify(result.data[0]),
      );

      if (result.success && result.data.length > 0) {
        const options: DeviceOption[] = result.data.map((device: Device) => ({
          label: device.device_name,
          value: String(device.device_id),
          raw: device,
        }));
        await saveData(STORAGE_KEYS.DEVICES, options);
        return options;
      }

      return [];
    },
    // staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    networkMode: "always",
  });


useEffect(() => {
  if (deviceOptions.length === 0) return;

  if (!selectedDevice) {
    setSelectedDevice(deviceOptions[0]);
    previousDeviceRef.current = deviceOptions[0];
  } else {
    const refreshed = deviceOptions.find(d => d.value === selectedDevice.value);
    if (refreshed) {
      setSelectedDevice(refreshed);
      previousDeviceRef.current = refreshed;
    }
  }
}, [deviceOptions]);


  useEffect(() => {
    if (selectedDevice?.raw) {
      fetchWeather(selectedDevice.raw);
    }
  }, [selectedDevice?.value]);

  // ── 2. Stations ────────────────────────────────────────
  const isMarinaDevice =
    selectedDevice?.raw?.where_from === "marina" &&
    selectedDevice?.raw?.latitude != null &&
    selectedDevice?.raw?.longitude != null;

  const { data: stations = [] } = useQuery<any[]>({
    queryKey: ["stations"],
    queryFn: async () => {
      const res = await axios.get(
        "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json",
      );
      return res.data?.stations ?? [];
    },
    enabled: !!selectedDevice?.value && isMarinaDevice && isConnected === true,
    // staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    networkMode: "always",
  });

  // ── 3. Monitoring ──────────────────────────────────────
  const { data: monitoringData, isLoading: loadingMonitoring } =
    useQuery<MonitoringCache>({
      queryKey: ["monitoring", selectedDevice?.value],
      queryFn: async () => {
        const device = selectedDevice!.raw;
        const key = `${STORAGE_KEYS.MONITORING}_${device.device_id}`;

        if (!isConnectedRef.current) {
          const cached = await loadData<MonitoringCache>(key, null as any);
          return (
            cached ?? { tilesConfig: [], alertCount: null, isArmed: false }
          );
        }

        if (
          previousDeviceRef.current &&
          previousDeviceRef.current.raw.device_id !== device.device_id
        ) {
          const oldKey = `${STORAGE_KEYS.MONITORING}_${previousDeviceRef.current.raw.device_id}`;
          await removeData(oldKey);
        }

        const result = await getDeviceDetails(device);

        if (result.success && result.data) {
          const xups = result.data.xups;
          const valuesObj = Array.isArray(result.data.deviceValues)
            ? result.data.deviceValues[0]
            : result.data.deviceValues;

          const tiles = getTilesConfig(xups, valuesObj);
          const count = valuesObj?.alert_count ?? null;
          const armed = Object.values(valuesObj ?? {}).includes("alert");

          const cache: MonitoringCache = {
            tilesConfig: tiles,
            alertCount: count,
            isArmed: armed,
          };

          await saveData<MonitoringCache>(key, cache);
          previousDeviceRef.current = selectedDevice;
          return cache;
        }

        return { tilesConfig: [], alertCount: null, isArmed: false };
      },
      enabled: !!selectedDevice?.value,
      // staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      networkMode: "always",
    });

  // ── 4. Tides ───────────────────────────────────────────
  const {
    data: tides = { first: "", second: "", third: "", fourth: "", next: "" },
    isLoading: loadingTides,
  } = useQuery<TidesCache>({
    queryKey: ["tides", selectedDevice?.value],
    queryFn: async () => {
      const device = selectedDevice!.raw;
      const key = `${STORAGE_KEYS.TIDES}_${device.device_id}`;

      if (!isConnectedRef.current) {
        const cached = await loadData<TidesCache>(key, null as any);
        return (
          cached ?? { first: "", second: "", third: "", fourth: "", next: "" }
        );
      }

      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

      const nearest = stations.reduce((best: any, station: any) => {
        const dist = haversineDistance(
          device.latitude!,
          device.longitude!,
          parseFloat(station.lat),
          parseFloat(station.lng),
        );
        if (!best || dist < best.dist) return { station, dist };
        return best;
      }, null);

      const tidesRes = await axios.get(
        "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter",
        {
          params: {
            product: "predictions",
            station: nearest?.station?.id ?? "8533615",
            begin_date: dateStr,
            end_date: dateStr,
            datum: "MLLW",
            units: "english",
            time_zone: "lst_ldt",
            interval: "hilo",
            format: "json",
          },
        },
      );

      const predictions = tidesRes.data.predictions ?? [];
      const sorted = [...predictions].sort(
        (a: any, b: any) => new Date(a.t).getTime() - new Date(b.t).getTime(),
      );
      const formatted = sorted.map(formatTideTime);
      const now = new Date();
      const nextTide = predictions.find((t: any) => new Date(t.t) > now);

      const result: TidesCache = {
        first: formatted[0] ?? "",
        second: formatted[1] ?? "",
        third: formatted[2] ?? "",
        fourth: formatted[3] ?? "",
        next: nextTide ? formatTideTime(nextTide) : "",
      };

      await saveData(key, result);
      return result;
    },
    enabled: !!selectedDevice?.value && isMarinaDevice && stations.length > 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    networkMode: "always",
    retry: false,
  });

  // ── 5. Handle Device Change ────────────────────────────
  const handleDeviceChange = (val: string | number) => {
    if (!isConnectedRef.current) {
      Toast.show({
        type: "info",
        text1: "Offline",
        text2: "No internet connection",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }
    const found = deviceOptions.find((d) => d.value === String(val));
    if (found) setSelectedDevice(found);
  };

  return {
    loadingDevices,
    loadingWeather,
    loadingMonitoring,
    loadingTides,
    isRefreshing,
    onRefresh,
    selectedDevice,
    deviceOptions,
    handleDeviceChange,
    tilesConfig: monitoringData?.tilesConfig ?? [],
    alertCount: monitoringData?.alertCount ?? null,
    isArmed: monitoringData?.isArmed ?? false,
    weatherData,
    formatTime,
    tides,
    isConnected,
  };
};
