import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  PacketRow,
  calculateElapsedTime,
  formatTempHumBat,
  formatTimeOnly,
  formatTimestamp,
  getEventDescription,
} from "../utils/packetHelpers";

const NetworkIcon = require("../assets/NetworkIcon.png");

// ─── Info Row Helpers ─────────────────────────────────────────────────────────

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View className="flex-row items-center py-[7px] border-b border-[#F1F5F9]">
    <Text className="text-[11px] text-gray-400 w-[130px]">{label}</Text>
    <View className="flex-1">{children}</View>
  </View>
);

const InfoText = ({ value }: { value: string }) => (
  <Text className="text-xs text-gray-900 font-medium" numberOfLines={1}>
    {value}
  </Text>
);

// ─── Single Event Card ────────────────────────────────────────────────────────

interface CardProps {
  row: PacketRow;
  index: number;
  getIsAlert: (row: PacketRow) => boolean;
  getAlertTimes: (index: number) => {
    isLastAlert: boolean;
    nextAlertTime: string | null;
  };
}

function EventCardItem({ row, index, getIsAlert, getAlertTimes }: CardProps) {
  const isAlert = getIsAlert(row);
  const { isLastAlert, nextAlertTime } = getAlertTimes(index);

  const elapsed = isAlert
    ? isLastAlert
      ? formatTimeOnly(row.updated_at)
      : nextAlertTime
      ? calculateElapsedTime(nextAlertTime, row.updated_at)
      : "---"
    : "---";

  return (
    <View
      className="bg-white rounded-xl p-4 mb-3 mx-1 border border-[#F1F5F9]"
      style={{
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }}
    >
      <View className="flex-row items-center justify-between mb-[10px] pb-[10px] border-b border-[#F1F5F9]">
        <Text
          className="text-sm font-bold text-[#1E3A5F] flex-1"
          numberOfLines={1}
        >
          {row.xNID ?? "---"}
        </Text>
        <View
          className={`${
            isAlert ? "bg-red-500" : "bg-green-500"
          } rounded-lg py-0.5 px-3 ml-2`}
        >
          <Text className="text-white text-[10px] font-semibold">
            {isAlert ? "ALERT" : "Check in"}
          </Text>
        </View>
      </View>

      <InfoRow label="Time Stamp">
        <InfoText value={formatTimestamp(row.updated_at)} />
      </InfoRow>
      <InfoRow label="DEVEUI">
        <InfoText value={row.devEUI ?? "---"} />
      </InfoRow>
      <InfoRow label="Description">
        <Text
          className={`text-xs font-medium ${
            isAlert ? "text-red-500" : "text-green-500"
          }`}
          numberOfLines={1}
        >
          {isAlert ? getEventDescription(row) : "Normal"}
        </Text>
      </InfoRow>
      <InfoRow label="Temp, Hum, Bat">
        <InfoText value={formatTempHumBat(row)} />
      </InfoRow>
      <InfoRow label="Gateway ID">
        <InfoText value={row.gatewayID ?? "---"} />
      </InfoRow>
      <InfoRow label="Network">
        <Image
          source={NetworkIcon}
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />
      </InfoRow>
      <InfoRow label="Elapsed">
        <InfoText value={elapsed} />
      </InfoRow>
    </View>
  );
}

// ─── Event Card List ──────────────────────────────────────────────────────────

interface EventCardListProps {
  rows: PacketRow[];
  totalRows: number;
  currentPage: number;
  rowsPerPage: number;
  isLoading: boolean;
  getIsAlert: (row: PacketRow) => boolean;
  getAlertTimes: (index: number) => {
    isLastAlert: boolean;
    nextAlertTime: string | null;
  };
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (limit: number) => void;
}

export function EventCardList({
  rows,
  totalRows,
  currentPage,
  rowsPerPage,
  isLoading,
  getIsAlert,
  getAlertTimes,
  onPageChange,
}: EventCardListProps) {
  const [accumulatedRows, setAccumulatedRows] = useState<PacketRow[]>(rows); // 👈 fix
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (rows.length === 0) return;

    if (isFirstLoad.current || currentPage === 1) {
      setAccumulatedRows(rows);
      isFirstLoad.current = false;
    } else {
      setAccumulatedRows((prev) => [...prev, ...rows]);
    }
  }, [rows]);

  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const hasMore = currentPage < totalPages;
  const loadedCount = accumulatedRows.length;

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      onPageChange(currentPage + 1);
    }
  };

  if (isLoading && accumulatedRows.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2C64B3" />
      </View>
    );
  }

  if (accumulatedRows.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-sm text-gray-400">No events found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={accumulatedRows}
      keyExtractor={(item, idx) => item?.id?.toString() ?? idx.toString()}
      contentContainerStyle={{
        paddingTop: 8,
        paddingHorizontal: 4,
        paddingBottom: 16,
      }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <EventCardItem
          row={item}
          index={index}
          getIsAlert={getIsAlert}
          getAlertTimes={getAlertTimes}
        />
      )}
      ListFooterComponent={
        <View className="items-center mt-1 mb-3">
          <Text className="text-xs text-gray-400 mb-3">
            {loadedCount} of {totalRows} events
          </Text>

          {hasMore ? (
            <Pressable
              onPress={handleLoadMore}
              disabled={isLoading}
              className="flex-row items-center gap-x-2 px-6 py-3 rounded-xl border border-[#2C64B3] bg-white"
              style={({ pressed }) => ({
                opacity: pressed || isLoading ? 0.6 : 1,
                elevation: 1,
                shadowColor: "#2C64B3",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
              })}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#2C64B3" />
              ) : (
                <Ionicons name="chevron-down" size={16} color="#2C64B3" />
              )}
              <Text className="text-sm font-semibold text-[#2C64B3]">
                {isLoading ? "Loading..." : "Load More"}
              </Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-x-1">
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text className="text-xs text-gray-400">All events loaded</Text>
            </View>
          )}
        </View>
      }
    />
  );
}