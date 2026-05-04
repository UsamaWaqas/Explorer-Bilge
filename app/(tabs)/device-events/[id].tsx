import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useEventColumns } from "../../../components/Events/EventColumns";
import { EventsHeader } from "../../../components/Events/EventsHeader";
import GlobalTable from "../../../components/Table";
import { usePackets } from "../../../hooks/usePackets";
import { usePusherEvent } from "../../../hooks/usePusher";
import {
  PacketRow,
  formatTempHumBat,
  formatTimestamp,
  getEventDescription,
} from "../../../utils/packetHelpers";

const NetworkIcon = require("../../../assets/NetworkIcon.png");

type ViewMode = "table" | "card";



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

// ─── Event Card ────────────────────────────────────────────────────────────────

interface EventCardProps {
  row: PacketRow;
  getIsAlert: (row: PacketRow) => boolean;
  getAlertTimes: (index: number) => {
    isLastAlert: boolean;
    nextAlertTime: string | null;
  };
  index: number;
}

const EventCard: React.FC<EventCardProps> = ({
  row,
  getIsAlert,
  getAlertTimes,
  index,
}) => {
  const isAlert = getIsAlert(row);
  const { isLastAlert, nextAlertTime } = getAlertTimes(index);

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
      {/* Header: xNID + Alert badge */}
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
        {!isAlert ? (
          <InfoText value="---" />
        ) : (
          <InfoText
            value={
              isLastAlert
                ? formatTimestamp(row.updated_at)
                : nextAlertTime
                ? nextAlertTime
                : "---"
            }
          />
        )}
      </InfoRow>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function DeviceEvents() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [accumulatedRows, setAccumulatedRows] = useState<PacketRow[]>([]);
  const isFirstLoad = useRef(true);

  const {
    rows,
    totalRows,
    isLoading,
    eventType,
    paginationParams,
    fetchPackets,
    handleEventTypeChange,
    handlePageChange,
    handleRowsPerPageChange,
    getIsAlert,
    getAlertTimes,
  } = usePackets({ device_id: id });

  useFocusEffect(
    useCallback(() => {
      fetchPackets();
    }, [fetchPackets])
  );

  usePusherEvent(fetchPackets);

  // Page 1 par reset, baqi par append
  useEffect(() => {
    if (rows.length === 0) return;

    if (isFirstLoad.current || paginationParams.currentPage === 1) {
      setAccumulatedRows(rows);
      isFirstLoad.current = false;
    } else {
      setAccumulatedRows((prev) => [...prev, ...rows]);
    }
  }, [rows]);

  const columns = useEventColumns({ rows, getIsAlert, getAlertTimes });

  const totalPages = Math.ceil(totalRows / paginationParams.limit);
  const hasMore = paginationParams.currentPage < totalPages;

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      handlePageChange(paginationParams.currentPage + 1);
    }
  };

  return (
    <View className="flex-1 bg-white py-3">
      <View className="flex-1">

        {/* ── Row 1: Title + Dropdown ── */}
        <View className="flex-row items-center justify-between py-1 px-3 bg-white border-b border-gray-200">
          <Text className="text-lg font-bold text-[#2C64B3]">Events Table</Text>
          <EventsHeader
            eventType={eventType}
            onEventTypeChange={(val) => {
              // eventType change par accumulated rows reset
              isFirstLoad.current = true;
              setAccumulatedRows([]);
              handleEventTypeChange(val);
            }}
            hideTitle
          />
        </View>

        {/* ── Row 2: Toggle — right side ── */}
        <View className="flex-row justify-end px-3 pt-2 pb-1 bg-white">
          <View className="flex-row border border-gray-200 rounded-lg overflow-hidden">
            <Pressable
              onPress={() => setViewMode("table")}
              className={`px-2.5 py-1.5 ${
                viewMode === "table" ? "bg-[#2C64B3]" : "bg-white"
              }`}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === "table" ? "#fff" : "#6B7280"}
              />
            </Pressable>
            <Pressable
              onPress={() => setViewMode("card")}
              className={`px-2.5 py-1.5 ${
                viewMode === "card" ? "bg-[#2C64B3]" : "bg-white"
              }`}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === "card" ? "#fff" : "#6B7280"}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Table View ── */}
        {viewMode === "table" && (
          <View className="p-2">
            <GlobalTable
              columns={columns}
              data={rows}
              defaultRowsPerPage={paginationParams.limit}
              totalRows={totalRows}
              currentPage={paginationParams.currentPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              isLoading={isLoading}
            />
          </View>
        )}

        {/* ── Card View: Load More ── */}
        {viewMode === "card" && (
          <>
            {isLoading && accumulatedRows.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2C64B3" />
              </View>
            ) : accumulatedRows.length === 0 ? (
              <View className="flex-1 justify-center items-center pt-16">
                <Text className="text-[15px] text-gray-500 font-medium">
                  No events found
                </Text>
              </View>
            ) : (
              <FlatList
                data={accumulatedRows}
                keyExtractor={(item, idx) =>
                  item?.id?.toString() ?? idx.toString()
                }
                contentContainerStyle={{
                  paddingTop: 8,
                  paddingHorizontal: 12,
                  paddingBottom: 16,
                }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <EventCard
                    row={item}
                    getIsAlert={getIsAlert}
                    getAlertTimes={getAlertTimes}
                    index={index}
                  />
                )}
                ListFooterComponent={
                  <View className="items-center mt-1 mb-3">
                    {/* Counter */}
                    <Text className="text-xs text-gray-400 mb-3">
                      {accumulatedRows.length} of {totalRows} events
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
                          <Ionicons
                            name="chevron-down"
                            size={16}
                            color="#2C64B3"
                          />
                        )}
                        <Text className="text-sm font-semibold text-[#2C64B3]">
                          {isLoading ? "Loading..." : "Load More"}
                        </Text>
                      </Pressable>
                    ) : (
                      <View className="flex-row items-center gap-x-1">
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#22c55e"
                        />
                        <Text className="text-xs text-gray-400">
                          All events loaded
                        </Text>
                      </View>
                    )}
                  </View>
                }
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}