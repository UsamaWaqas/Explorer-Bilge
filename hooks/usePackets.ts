import { useAlarmStore } from "@/store/alarmStore";
import { useAuthStore } from "@/store/authStore";
import { keepPreviousData } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_KEYS } from "../constants/keys";
import { loadData, saveData } from "../utils/asyncStorage";
import {
  PacketProduct,
  PacketRow,
  PacketsApiResponse,
} from "../utils/packetHelpers";
import { useNetwork } from "./useNetwork";
import { useSimpleQuery } from "./useSimpleQuery";

type ProductsApiResponse = {
  data: PacketProduct[];
};

type PacketCache = {
  data: PacketRow[];
  total: number;
  last_page: number;
  savedAt: number;
};

type UsePacketsOptions = {
  device_id?: string;
};

const applyLocalSearch = (data: PacketRow[], search: string): PacketRow[] => {
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

const hasNotificationLog = (notification_log: any): boolean => {
  if (!notification_log) return false;
  if (typeof notification_log === "string")
    return notification_log.trim() !== "";
  if (Array.isArray(notification_log)) return notification_log.length > 0;
  if (typeof notification_log === "object") {
    const emailSent = notification_log.email_sent_to;
    const smsSent = notification_log.sms_sent_to;
    const emailHasData = Array.isArray(emailSent) && emailSent.length > 0;
    const smsHasData = Array.isArray(smsSent) && smsSent.length > 0;
    return emailHasData || smsHasData;
  }
  return false;
};

export const usePackets = ({ device_id }: UsePacketsOptions = {}) => {
  const { user } = useAuthStore();
  const { isAlarm, setProducts } = useAlarmStore();
  const { isConnected } = useNetwork();

  const [eventType, setEventType] = useState("");
  const [offlineRows, setOfflineRows] = useState<PacketRow[]>([]);
  const [offlineTotal, setOfflineTotal] = useState(0);
  const [offlineLastPage, setOfflineLastPage] = useState(1);
  const [paginationParams, setPaginationParams] = useState({
    currentPage: 1,
    limit: 10,
    eventType: "",
  });

  const endpoint = device_id
    ? `/api/sensors/get-data-values/${device_id}`
    : `/api/devices/data-values`;

  const cacheKey = device_id ? `packets-device-${device_id}` : "packets";

  useEffect(() => {
    setPaginationParams({
      currentPage: 1,
      limit: 10,
      eventType: "",
    });
    setEventType("");
    setOfflineRows([]);
    setOfflineTotal(0);
  }, [device_id]);

  // ─── Products Query ────────────────────────────────────────────────────────
  const { data: productsResponse, isLoading: isProductsLoading } =
    useSimpleQuery<ProductsApiResponse>(
      "packet-products",
      `/api/deviceTypes/getDeviceTypesByUserId/${user?.id}`,
      {},
      {
        enabled: !!user?.id,
        // staleTime: 1000 * 60 * 10,
        // gcTime: 1000 * 60 * 30,
      },
    );

  const products = useMemo(
    () => productsResponse?.data ?? [],
    [productsResponse?.data],
  );

  useEffect(() => {
    if (products.length > 0) {
      setProducts(products as any);
    }
  }, [products]);

  const packetParams = useMemo(
    () => ({
      user_id: user?.id,
      limit: paginationParams.limit,
      offset: (paginationParams.currentPage - 1) * paginationParams.limit,
      page: paginationParams.currentPage,
      search: paginationParams.eventType,
    }),
    [
      user?.id,
      paginationParams.limit,
      paginationParams.currentPage,
      paginationParams.eventType,
    ],
  );

  // ─── Packets Query ─────────────────────────────────────────────────────────
  const {
    data: packetsResponse,
    isFetching,
    isLoading: isPacketsLoading,
    refetch: fetchPackets,
  } = useSimpleQuery<PacketsApiResponse>(cacheKey, endpoint, packetParams, {
    enabled: !!user?.id,
    // staleTime: 1000 * 30,
    // gcTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

  // ─── Stable fetchPackets via useRef ───────────────────────────────────────
  const fetchPacketsRef = useRef(fetchPackets);
  useEffect(() => {
    fetchPacketsRef.current = fetchPackets;
  }, [fetchPackets]);

  const stableFetchPackets = useCallback(() => {
    fetchPacketsRef.current();
  }, []);

  const normalizedResponse = useMemo(() => {
    if (!packetsResponse) return undefined;
    const xNID = (packetsResponse as any).xNID;
    const device_type_name = (packetsResponse as any).device_type_name;
    const product_id = (packetsResponse as any).product_id;
    return {
      ...packetsResponse,
      data: packetsResponse.data?.map((row) => ({
        ...row,
        xNID: xNID ?? row.xNID,

        device_type_name: row.device_type_name ?? device_type_name,
        product_id: row.product_id ?? product_id,
      })),
    };
  }, [packetsResponse]);
  console.log(
    "API rdssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssows:",
    endpoint,
    normalizedResponse,
    // JSON.stringify(normalizedResponse?.data, null, 2),
  );

  // ─── Final data — API priority, fallback AsyncStorage ─────────────────────
  const rows: PacketRow[] = normalizedResponse?.data ?? offlineRows;
  const totalRows: number = normalizedResponse?.total ?? offlineTotal;
  const lastPage: number = normalizedResponse?.last_page ?? offlineLastPage;

  // ─── Combined isLoading ────────────────────────────────────────────────────
  const isLoading =
    isPacketsLoading || isProductsLoading || (isFetching && rows.length === 0);

  useEffect(() => {
    if (
      normalizedResponse?.data &&
      paginationParams.currentPage === 1 &&
      !paginationParams.eventType
    ) {
      const storageKey = device_id
        ? `${STORAGE_KEYS.EVENTS}_device_${device_id}`
        : STORAGE_KEYS.EVENTS;

      saveData<PacketCache>(storageKey, {
        data: normalizedResponse.data,
        total: normalizedResponse.total ?? 0,
        last_page: normalizedResponse.last_page ?? 1,
        savedAt: Date.now(),
      });
    }
  }, [normalizedResponse]);

  useEffect(() => {
    const load = async () => {
      if (isConnected && normalizedResponse?.data) return;

      const storageKey = device_id
        ? `${STORAGE_KEYS.EVENTS}_device_${device_id}`
        : STORAGE_KEYS.EVENTS;

      const cached = await loadData<PacketCache>(storageKey, {
        data: [],
        total: 0,
        last_page: 1,
        savedAt: 0,
      });

      if (!cached?.data?.length) return;

      const isExpired = Date.now() - cached.savedAt > 1000 * 60 * 60 * 8;
      if (isExpired) return;

      const filtered = applyLocalSearch(
        cached.data,
        paginationParams.eventType,
      );
      setOfflineRows(filtered);
      setOfflineTotal(filtered.length);
      setOfflineLastPage(cached.last_page);
    };

    load();
  }, [isConnected, normalizedResponse, paginationParams, device_id]);

  const handleEventTypeChange = useCallback((val: string) => {
    setEventType(val);
    setOfflineRows([]);
    setOfflineTotal(0);
    setPaginationParams((prev) => ({
      ...prev,
      eventType: val,
      currentPage: 1,
    }));
  }, []);

  // ─── Page Change Handler ───────────────────────────────────────────────────
  const handlePageChange = useCallback((page: number) => {
    setOfflineRows([]);
    setOfflineTotal(0);
    setPaginationParams((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // ─── Limit Change Handler ──────────────────────────────────────────────────
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setPaginationParams((prev) => ({
      ...prev,
      limit: newLimit,
      currentPage: 1,
    }));
  }, []);

  const checkIsAlert = useCallback(
    (row: PacketRow): boolean => {
      // if (hasNotificationLog(row.notification_log)) return true;
      // if (row.external_input === true || row.external_input === 1) return true;
      // if (row.move === true || row.move === 1) return true;

      // if (row.reed_state === 0 || row.reed_state === false) return true;

      const product = (products.find((p) => p.id == row.product_id) ??
        null) as any;
      return isAlarm(row, product);
    },
    [products, isAlarm],
  );

  const getIsAlert = useCallback(
    (row: PacketRow): boolean => checkIsAlert(row),
    [checkIsAlert],
  );

  const getAlertTimes = useCallback(
    (index: number) => {
      let nextAlertTime: string | null = null;
      let isLastAlert = true;
      for (let j = index + 1; j < rows.length; j++) {
        if (checkIsAlert(rows[j])) {
          nextAlertTime = rows[j].updated_at;
          isLastAlert = false;
          break;
        }
      }
      return { isLastAlert, nextAlertTime };
    },
    [rows, checkIsAlert],
  );

  return {
    rows,
    totalRows,
    lastPage,
    isFetching,
    isLoading,
    isConnected,
    eventType,
    paginationParams,
    fetchPackets: stableFetchPackets,
    handleEventTypeChange,
    handlePageChange,
    handleRowsPerPageChange,
    getIsAlert,
    getAlertTimes,
  };
};
