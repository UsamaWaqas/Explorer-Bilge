import { useAlarmStore } from "@/store/alarmStore";
import { useAuthStore } from "@/store/authStore";
import { useCallback, useEffect, useState } from "react";
import { get } from "../api/apiHelper";
import {
  PacketProduct,
  PacketRow,
  PacketsApiResponse,
} from "../utils/packetHelpers";
import { useNetwork } from "./useNetwork";
import { saveData, loadData } from "../utils/asyncStorage";
import { STORAGE_KEYS } from "../constants/keys"

export const usePackets = () => {
  const { user } = useAuthStore();
  const { isAlarm } = useAlarmStore();
  const isConnected = useNetwork();

  const [products, setProducts] = useState<PacketProduct[]>([]);
  const [packetData, setPacketData] = useState<PacketsApiResponse | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [eventType, setEventType] = useState("");

  const [paginationParams, setPaginationParams] = useState({
    currentPage: 1,
    limit: 10,
    eventType: "",
  });

  useEffect(() => {
    if (!user?.id) return;
    get(`/api/deviceTypes/getDeviceTypesByUserId/${user.id}`)
      .then((res) => setProducts(res?.data ?? []))
      .catch(() => setProducts([]));
  }, [user?.id]);

  const fetchPackets = useCallback(async () => {
    if (!user?.id) return;

    if (!isConnected) {
      const cached = await loadData<PacketsApiResponse>(
        STORAGE_KEYS.EVENTS,
        null as any
      );
      if (cached) setPacketData(cached);
      return;
    }

    setIsFetching(true);
    try {
      const { currentPage, limit, eventType } = paginationParams;
      const offset = (currentPage - 1) * limit;
      const res = await get(
        `/api/devices/data-values?limit=${limit}&offset=${offset}&page=${currentPage}&search=${eventType}`
      );
      setPacketData(res);

      if (currentPage === 1) {
        await saveData(STORAGE_KEYS.EVENTS, res);
      }
    } catch {
      const cached = await loadData<PacketsApiResponse>(
        STORAGE_KEYS.EVENTS,
        null as any
      );
      if (cached) setPacketData(cached);
    } finally {
      setIsFetching(false);
    }
  }, [user?.id, paginationParams, isConnected]);

  useEffect(() => {
    fetchPackets();
  }, [fetchPackets]);

  const handleEventTypeChange = (val: string) => {
    setEventType(val);
    setPaginationParams((prev) => ({
      ...prev,
      eventType: val,
      currentPage: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setPaginationParams((prev) => ({ ...prev, currentPage: page }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setPaginationParams((prev) => ({
      ...prev,
      limit: newLimit,
      currentPage: 1,
    }));
  };

  const rows = packetData?.data ?? [];
  const totalRows = packetData?.total ?? 0;

  const getIsAlert = (row: PacketRow): boolean => {
    const product = (
      products.find((p) => p.id == row.product_id) ?? null
    ) as any;
    return isAlarm(row, product);
  };

  const getAlertTimes = (index: number) => {
    let nextAlertTime: string | null = null;
    let isLastAlert = true;
    for (let j = index + 1; j < rows.length; j++) {
      const product = (
        products.find((p) => p.id == rows[j].product_id) ?? null
      ) as any;
      if (isAlarm(rows[j], product)) {
        nextAlertTime = rows[j].updated_at;
        isLastAlert = false;
        break;
      }
    }
    return { isLastAlert, nextAlertTime };
  };

  return {
    rows,
    totalRows,
    isFetching,
    isConnected,
    eventType,
    paginationParams,
    handleEventTypeChange,
    handlePageChange,
    handleRowsPerPageChange,
    getIsAlert,
    getAlertTimes,
  };
};