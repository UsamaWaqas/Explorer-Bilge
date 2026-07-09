// src/hooks/useWeather.ts

import { useRef, useState } from "react";
import { getWeatherData } from "../services/weatherService";

interface Device {
  latitude: number | null;
  longitude: number | null;
}

interface WeatherCache {
  [key: string]: {
    data: any;
    timestamp: number;
  };
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const useWeather = () => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherCache, setWeatherCache] = useState<WeatherCache>({});
  const weatherLoaded = useRef(false);

  const getCacheKey = (device: Device) =>
    `${device.latitude}_${device.longitude}`;

  const isCacheValid = (key: string, cache: WeatherCache) => {
    const cached = cache[key];
    return cached && Date.now() - cached.timestamp < CACHE_DURATION;
  };

  // ── FIX: removed checkShouldShowLoading ──────────────────────────────────
  // This function was being called with an empty {} cache in useDashboard,
  // making it always set loadingWeather(true) uselessly. fetchWeather already
  // manages loadingWeather correctly on its own, so this abstraction was
  // both redundant and misleading.

  const fetchWeather = async (device: Device | null | undefined) => {
    // ── FIX 1: top-level undefined guard ─────────────────────────────────
    // Catches the case where device itself is undefined/null before
    // trying to access any property on it (the source of the crash).
    if (!device) {
      setWeatherData(null);
      setLoadingWeather(false);
      return;
    }

   
    if (!device.latitude || !device.longitude) {
      setWeatherData(null);
      setLoadingWeather(false);
      return;
    }

    const key = getCacheKey(device);

    // Cache hit → return immediately
    if (isCacheValid(key, weatherCache)) {
      setWeatherData(weatherCache[key].data);
      setLoadingWeather(false);
      weatherLoaded.current = true;
      return;
    }

  
    setLoadingWeather(true);

    const result = await getWeatherData(device.latitude, device.longitude);
    setLoadingWeather(false);
    weatherLoaded.current = true;

    if (result.success) {
      setWeatherData(result.data);
      setWeatherCache((prev) => ({
        ...prev,
        [key]: { data: result.data, timestamp: Date.now() },
      }));
    }
  };

  const formatTime = (unix: number) =>
  new Date(unix * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC", 
  })

  return {
    weatherData,
    loadingWeather,
    fetchWeather,
    formatTime,
  };
};