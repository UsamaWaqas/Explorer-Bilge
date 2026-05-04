import { useAlarmStore } from "@/store/alarmStore";
import { useAuthStore } from "@/store/authStore";
import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { STORAGE_KEYS } from "../constants/keys";
import { AlarmProduct } from "../types/Alarm.types";
import { DeviceRow, PaginationParams } from "../types/UserDevices.types";
import { isGreaterThan24Hours } from "../utils/Devicehelpers";
import { loadData, saveData } from "../utils/asyncStorage";
import { useNetwork } from "./useNetwork";
import { useSimpleQuery } from "./useSimpleQuery";

type DevicesApiResponse = {
  data: {
    data: DeviceRow[];
    total?: number;
  };
};

type ProductsApiResponse = {
  data: AlarmProduct[];
};

type DeviceCache = {
  data: DeviceRow[];
  total: number;
  savedAt: number;
};

const applyLocalSearch = (data: DeviceRow[], search: string): DeviceRow[] => {
  if (!search.trim()) return data;
  const lower = search.toLowerCase();
  return data.filter((row) =>
    Object.values(row).some((val) =>
      String(val ?? "")
        .toLowerCase()
        .includes(lower),
    ),
  );
};

export function useUserDevices() {
  const { user } = useAuthStore();
  const { isAlarm, setProducts, products } = useAlarmStore();
  const { isConnected } = useNetwork();

  const [searchText, setSearchText] = useState("");
  const [settingsRow, setSettingsRow] = useState<DeviceRow | null>(null);
  const [offlineRows, setOfflineRows] = useState<DeviceRow[]>([]);
  const [offlineTotal, setOfflineTotal] = useState(0);
  const [paginationParams, setPaginationParams] = useState<PaginationParams>({
    currentPage: 1,
    limit: 10,
    searchInput: "",
  });

  const { data: productsResponse } = useSimpleQuery<ProductsApiResponse>(
    "products-by-user",
    `/api/deviceTypes/getDeviceTypesByUserId/${user?.id}`,
    {},
    {
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
    },
  );

  useEffect(() => {
    if (productsResponse?.data) {
      setProducts(productsResponse.data);
    }
  }, [productsResponse?.data]);

  const {
    data: devicesResponse,
    isFetching,
    isLoading, 
    refetch: fetchDevices,
  } = useSimpleQuery<DevicesApiResponse>(
    "user-devices",
    `/api/device-values/user/${user?.id}/device-type`,
    {
      limit: paginationParams.limit,
      offset: (paginationParams.currentPage - 1) * paginationParams.limit,
      search: paginationParams.searchInput,
    },
    {
      enabled: !!user?.id,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
    },
  );

  useEffect(() => {
    if (
      devicesResponse?.data?.data &&
      paginationParams.currentPage === 1 &&
      !paginationParams.searchInput
    ) {
      saveData<DeviceCache>(STORAGE_KEYS.DEVICES, {
        data: devicesResponse.data.data,
        total: devicesResponse.data.total ?? 0,
        savedAt: Date.now(),
      });
    }
  }, [devicesResponse]);

  useEffect(() => {
    const load = async () => {
      if (isConnected && devicesResponse?.data?.data) return;

      const cached = await loadData<DeviceCache>(STORAGE_KEYS.DEVICES, {
        data: [],
        total: 0,
        savedAt: 0,
      });

      if (!cached?.data?.length) return;

      const isExpired = Date.now() - cached.savedAt > 1000 * 60 * 60 * 8;
      if (isExpired) return;

      const filtered = applyLocalSearch(
        cached.data,
        paginationParams.searchInput,
      );
      setOfflineRows(filtered);
      setOfflineTotal(filtered.length);
    };

    load();
  }, [isConnected, devicesResponse, paginationParams]);

  const rows: DeviceRow[] = devicesResponse?.data?.data ?? offlineRows;
  const totalRows: number = devicesResponse?.data?.total ?? offlineTotal;

  const handleSearchChange = useCallback((val: string) => {
    setSearchText(val);
    setOfflineRows([]);
    setOfflineTotal(0);
    setPaginationParams((prev) => ({
      ...prev,
      searchInput: val,
      currentPage: 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setOfflineRows([]);
    setOfflineTotal(0);
    setPaginationParams((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setPaginationParams((prev) => ({ ...prev, limit, currentPage: 1 }));
  }, []);

  const openMap = useCallback((row: DeviceRow) => {
    if (row.latitude && row.longitude) {
      Linking.openURL(
        `https://www.google.com/maps?q=${row.latitude},${row.longitude}`,
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
    [products, isAlarm],
  );

  return {
    user,
    rows,
    totalRows,
    isFetching,
    isLoading, 
    isConnected,
    searchText,
    settingsRow,
    paginationParams,
    setSettingsRow,
    fetchDevices,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    openMap,
    getDotColor,
  };
}
