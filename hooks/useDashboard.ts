// src/hooks/useDashboard.ts

import { useEffect, useState } from "react";
import axios from "axios";
import { getDeviceDetails, getDevicesList } from "../services/deviceService";
import {
  getTilesConfig,
  haversineDistance,
  formatTideTime,
} from "../utils/XupTileData";
import { useWeather } from "./useWeather";
import { useNetwork } from "./useNetwork";
import { saveData, loadData } from "../utils/asyncStorage";
import { STORAGE_KEYS } from "../constants/keys";

interface Device {
  device_id: number;
  device_name: string;
  device_location: string;
  where_from?: string;
  assign_entity_id: number;
  latitude: number | null;
  longitude: number | null;
}

interface DeviceOption {
  label: string;
  value: string;
  raw: Device;
}

interface MonitoringCache {
  tilesConfig: any[];
  alertCount: number | null;
  isArmed: boolean;
}

interface TidesCache {
  first: string;
  second: string;
  third: string;
  fourth: string;
  next: string;
}

export const useDashboard = () => {
  const isConnected = useNetwork();

  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingMonitoring, setLoadingMonitoring] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<DeviceOption | null>(null);
  const [deviceOptions, setDeviceOptions] = useState<DeviceOption[]>([]);
  const [tilesConfig, setTilesConfig] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const [isArmed, setIsArmed] = useState(false);
  const [tides, setTides] = useState<TidesCache>({
    first: "",
    second: "",
    third: "",
    fourth: "",
    next: "",
  });
  const [loadingTides, setLoadingTides] = useState(false);

  const { weatherData, loadingWeather, fetchWeather, formatTime } = useWeather();

  // ── 1. Devices ─────────────────────────────────────────
  useEffect(() => {
    const fetchDevices = async () => {
      setLoadingDevices(true);

      if (!isConnected) {
        const cached = await loadData<DeviceOption[]>(STORAGE_KEYS.DEVICES, []);
        if (cached.length > 0) {
          setDeviceOptions(cached);
          setSelectedDevice(cached[0]);
        }
        setLoadingDevices(false);
        return;
      }

      const result = await getDevicesList();
      if (result.success && result.data.length > 0) {
        const options = result.data.map((device: Device) => ({
          label: device.device_name,
          value: String(device.device_id),
          raw: device,
        }));
        setDeviceOptions(options);
        setSelectedDevice(options[0]);
        await saveData(STORAGE_KEYS.DEVICES, options);
      }

      setLoadingDevices(false);
    };

    fetchDevices();
  }, [isConnected]);

  // ── 2. Device Change ───────────────────────────────────
  useEffect(() => {
    if (!selectedDevice) return;

    const device = selectedDevice.raw;

    // ALWAYS clear UI first (important)
    setTilesConfig([]);
    setAlertCount(null);
    setIsArmed(false);
    setTides({ first: "", second: "", third: "", fourth: "", next: "" });

    // Always fetch (online/offline handled inside)
    fetchDeviceDetails(device);
    fetchWeather(device);
    fetchTides(device);
  }, [selectedDevice?.value]);

  // ── 3. Monitoring ──────────────────────────────────────
  const fetchDeviceDetails = async (device: Device) => {
    const key = `${STORAGE_KEYS.MONITORING}_${device.device_id}`;

    if (!isConnected) {
      const cached = await loadData<MonitoringCache>(key, null as any);

      if (cached) {
        setTilesConfig(cached.tilesConfig);
        setAlertCount(cached.alertCount);
        setIsArmed(cached.isArmed);
      }

      setLoadingMonitoring(false);
      return;
    }

    const result = await getDeviceDetails(device.device_id);
    setLoadingMonitoring(false);

    if (result.success && result.data) {
      const xups = result.data.xups;
      const valuesObj = Array.isArray(result.data.deviceValues)
        ? result.data.deviceValues[0]
        : result.data.deviceValues;

      const tiles = getTilesConfig(xups, valuesObj);
      const count = valuesObj?.alert_count ?? null;
      const armed = Object.values(valuesObj ?? {}).includes("alert");

      setTilesConfig(tiles);
      setAlertCount(count);
      setIsArmed(armed);

      await saveData<MonitoringCache>(key, {
        tilesConfig: tiles,
        alertCount: count,
        isArmed: armed,
      });
    }
  };

  // ── 4. Tides ───────────────────────────────────────────
  const fetchTides = async (device: Device) => {
    const key = `${STORAGE_KEYS.TIDES}_${device.device_id}`;

    if (
      device.where_from !== "marina" ||
      device.latitude == null ||
      device.longitude == null
    ) {
      return;
    }

    if (!isConnected) {
      const cached = await loadData<TidesCache>(key, null as any);
      if (cached) setTides(cached);
      return;
    }

    setLoadingTides(true);

    try {
      const stationsRes = await axios.get(
        "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json"
      );

      const stations = stationsRes.data.stations ?? [];

      const nearest = stations.reduce((best: any, station: any) => {
        const dist = haversineDistance(
          device.latitude!,
          device.longitude!,
          parseFloat(station.lat),
          parseFloat(station.lng)
        );
        if (!best || dist < best.dist) return { station, dist };
        return best;
      }, null);

      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(
        today.getMonth() + 1
      ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

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
        }
      );

      const predictions = tidesRes.data.predictions ?? [];
      const sorted = [...predictions].sort(
        (a, b) => new Date(a.t).getTime() - new Date(b.t).getTime()
      );

      const formatted = sorted.map(formatTideTime);
      const nextTide = predictions.find((t: any) => new Date(t.t) > new Date());

      const result: TidesCache = {
        first: formatted[0] ?? "",
        second: formatted[1] ?? "",
        third: formatted[2] ?? "",
        fourth: formatted[3] ?? "",
        next: nextTide ? formatTideTime(nextTide) : "",
      };

      setTides(result);
      await saveData(key, result);
    } catch (e) {
      const cached = await loadData<TidesCache>(key, null as any);
      if (cached) setTides(cached);
    } finally {
      setLoadingTides(false);
    }
  };

  const handleDeviceChange = (val: string | number) => {
    const found = deviceOptions.find((d) => d.value === String(val));
    if (found) setSelectedDevice(found);
  };

  return {
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
    isConnected,
  };
};