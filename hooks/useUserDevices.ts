import { useAlarmStore } from "@/store/alarmStore";
import { useAuthStore } from "@/store/authStore";
import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { STORAGE_KEYS } from "../constants/keys";
import {
  fetchDevicesService,
  fetchProductsByUserService,
} from "../services/userDeviceservices";
import { DeviceRow, PaginationParams } from "../types/UserDevices.types";
import { loadData, saveData } from "../utils/asyncStorage";
import { isGreaterThan24Hours } from "../utils/Devicehelpers";
import { useNetwork } from "./useNetwork";

export function useUserDevices() {
  const { user } = useAuthStore();
  const { isAlarm, setProducts, products } = useAlarmStore();
  const { isConnected } = useNetwork();

  const [searchText, setSearchText] = useState("");
  const [settingsRow, setSettingsRow] = useState<DeviceRow | null>(null);
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [paginationParams, setPaginationParams] = useState<PaginationParams>({
    currentPage: 1,
    limit: 10,
    searchInput: "",
  });

  // Fetch products on mount
  useEffect(() => {
    if (!user?.id) return;
    fetchProductsByUserService(user.id).then(setProducts);
  }, [user?.id]);

  // Background prefetch — jab bhi online ho, full data cache kar lo
  const prefetchAllDevices = useCallback(async () => {
    if (!user?.id || !isConnected) return;
    try {
      const allData = await fetchDevicesService(user.id, 1, 10, "");
      if (allData && allData.length > 0) {
        await saveData(STORAGE_KEYS.DEVICES, allData);
      }
    } catch {
      // silently fail — prefetch is best-effort
    }
  }, [user?.id, isConnected]);

  useEffect(() => {
    prefetchAllDevices();
  }, [prefetchAllDevices]);

  const applyLocalSearch = (data: DeviceRow[], search: string): DeviceRow[] => {
    if (!search.trim()) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(lower)
      )
    );
  };

  const fetchDevices = useCallback(async () => {
    if (!user?.id) return;

    // OFFLINE MODE
    if (!isConnected) {
      const cached = await loadData<DeviceRow[]>(STORAGE_KEYS.DEVICES, []);
      const filtered = applyLocalSearch(cached, paginationParams.searchInput);
      setRows(filtered);
      return;
    }

    // ONLINE MODE
    setIsFetching(true);
    try {
      const data = await fetchDevicesService(
        user.id,
        paginationParams.currentPage,
        paginationParams.limit,
        paginationParams.searchInput
      );
      setRows(data);

      // Sirf unsearched data cache karo taake cache clean rahe
      if (!paginationParams.searchInput) {
        await saveData(STORAGE_KEYS.DEVICES, data);
      }
    } catch {
      // Network error — fallback to cache with local search
      const cached = await loadData<DeviceRow[]>(STORAGE_KEYS.DEVICES, []);
      const filtered = applyLocalSearch(cached, paginationParams.searchInput);
      setRows(filtered);
    } finally {
      setIsFetching(false);
    }
  }, [user?.id, paginationParams, isConnected]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    setPaginationParams((prev) => ({
      ...prev,
      searchInput: val,
      currentPage: 1,
    }));
  };

  const openMap = useCallback((row: DeviceRow) => {
    if (row.latitude && row.longitude) {
      Linking.openURL(
        `https://www.google.com/maps?q=${row.latitude},${row.longitude}`
      );
    }
  }, []);

  const getDotColor = useCallback(
    (row: DeviceRow): string => {
      if (isGreaterThan24Hours(row.updated_at)) return "orange";
      const product = products.find((p) => p.id == row.product_id) ?? null;
      if (isAlarm(row, product)) return "red";
      return "green";
    },
    [products, isAlarm]
  );

  return {
    user,
    rows,
    isFetching,
    isConnected,
    searchText,
    settingsRow,
    setSettingsRow,
    fetchDevices,
    handleSearchChange,
    openMap,
    getDotColor,
  };
}