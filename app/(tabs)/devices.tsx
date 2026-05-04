import GlobalTable from "@/components/Table";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EditableCell from "../../components/devices/EditableCell";
import EventDot from "../../components/devices/EventDot";
import OptionsCell from "../../components/devices/OptionsCell";
import SettingsModal from "../../components/devices/SettingsModal";
import GlobalInput from "../../components/Input";
import { getUserDeviceColumns } from "../../constants/userDeviceColumns";
import { usePusherEvent } from "../../hooks/usePusher";
import { useUserDevices } from "../../hooks/useUserDevices";
import { DeviceRow } from "../../types/UserDevices.types";
import { formatTempHumBat, formatTimestamp } from "../../utils/Devicehelpers";

// ─── View Toggle Icons ────────────────────────────────────────────────────────

const TableIcon = ({ active }: { active: boolean }) => (
  <Text className={`text-base ${active ? "text-[#2C64B3]" : "text-gray-400"}`}>
    ⊞
  </Text>
);

const CardIcon = ({ active }: { active: boolean }) => (
  <Text className={`text-base ${active ? "text-[#2C64B3]" : "text-gray-400"}`}>
    ❖
  </Text>
);


const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View className="flex-row items-center py-[7px] border-b border-[#F1F5F9]">
    <Text className="text-[11px] text-gray-400 w-[120px]">{label}</Text>
    <View className="flex-1">{children}</View>
  </View>
);

const InfoText = ({ value }: { value: string }) => (
  <Text className="text-xs text-gray-900 font-medium" numberOfLines={1}>
    {value}
  </Text>
);

// ─── Device Card ──────────────────────────────────────────────────────────────

interface DeviceCardProps {
  row: DeviceRow;
  user: { title?: string } | null;
  getDotColor: (row: DeviceRow) => string;
  openMap: (row: DeviceRow) => void;
  setSettingsRow: (row: DeviceRow) => void;
  fetchDevices: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  row,
  user,
  getDotColor,
  openMap,
  setSettingsRow,
  fetchDevices,
}) => {
  const dotColor = getDotColor(row);

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
      {/* ── Header: Event dot + Device Name + Options ── */}
      <View className="flex-row items-center justify-between mb-[10px] pb-[10px] border-b border-[#F1F5F9]">
        <View className="flex-row items-center gap-2 flex-1">
          <EventDot color={dotColor} />
          <Text
            className="text-sm font-bold text-[#1E3A5F] flex-1"
            numberOfLines={1}
          >
            {row?.room_name ?? row?.device_name ?? "Unknown Device"}
          </Text>
        </View>
        <OptionsCell row={row} onSettingsPress={setSettingsRow} />
      </View>

      {/* ── Fields ── */}

      <InfoRow label="xNID">
        <InfoText value={row?.xNID ?? "---"} />
      </InfoRow>

      <InfoRow label="Device ID">
        <InfoText value={row?.name ?? "---"} />
      </InfoRow>

      {user?.title !== "Customer" && (
        <InfoRow label="Unit">
          <InfoText value={row?.unit_name ?? "---"} />
        </InfoRow>
      )}

      <InfoRow label="Device Location">
        <EditableCell
          value={row?.area_name ?? row?.device_location ?? ""}
          fieldKey="deviceLocation"
          row={row}
          onRefetch={fetchDevices}
        />
      </InfoRow>

      <InfoRow label="Device Name">
        <EditableCell
          value={row?.room_name ?? row?.device_name ?? ""}
          fieldKey="deviceName"
          row={row}
          onRefetch={fetchDevices}
        />
      </InfoRow>

      <InfoRow label="Time Stamp">
        <InfoText value={formatTimestamp(row?.updated_at)} />
      </InfoRow>

      <InfoRow label="Temp, Hum, Bat">
        <InfoText value={formatTempHumBat(row)} />
      </InfoRow>

      <InfoRow label="Gateway ID">
        <InfoText value={row?.gatewayID ?? "---"} />
      </InfoRow>

      <InfoRow label="Geo Location">
        {row?.latitude && row?.longitude ? (
          <TouchableOpacity onPress={() => openMap(row)}>
            <Ionicons name="location" size={20} color="#2563eb" />
          </TouchableOpacity>
        ) : (
          <InfoText value="---" />
        )}
      </InfoRow>
    </View>
  );
};


type ViewMode = "table" | "card";

const UserDevices: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const {
    user,
    rows,
    totalRows,
    isLoading,
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
  } = useUserDevices();

  usePusherEvent(fetchDevices);

  useFocusEffect(
    useCallback(() => {
      fetchDevices();
    }, [fetchDevices])
  );

  const columns = useMemo(
    () =>
      getUserDeviceColumns({
        user,
        fetchDevices,
        openMap,
        getDotColor,
        setSettingsRow,
      }),
    [user, fetchDevices, openMap, getDotColor, setSettingsRow]
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">

        {/* ── Header ── */}
        <View className="flex-row px-4 py-3 items-center justify-between bg-white border-b border-gray-200 mb-4">
          <Text className="text-lg font-bold text-[#2C64B3]">My Devices</Text>

          <View className="flex-row items-center gap-[10px]">
            <GlobalInput
              placeholder="Search..."
              value={searchText}
              onChangeText={handleSearchChange}
              containerClassName="w-[160px]"
              inputClassName="text-[13px]"
            />

            {/* Table / Card toggle */}
          
          </View>
        </View>
         <View className="self-end flex-row bg-slate-100 rounded-lg p-[3px] mx-4 mb-2">
  {(["table", "card"] as ViewMode[]).map((mode) => (
    <TouchableOpacity
      key={mode}
      onPress={() => setViewMode(mode)}
      className={`px-[10px] py-[5px] rounded-md ${
        viewMode === mode ? "bg-white" : "bg-transparent"
      }`}
      style={
        viewMode === mode
          ? {
              elevation: 1,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }
          : undefined
      }
    >
      {mode === "table" ? (
        <TableIcon active={viewMode === "table"} />
      ) : (
        <CardIcon active={viewMode === "card"} />
      )}
    </TouchableOpacity>
  ))}
</View>

        {/* ── Table View ── */}
        {viewMode === "table" && (
          <View className="p-2"> 
          <GlobalTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            totalRows={totalRows}
            currentPage={paginationParams.currentPage}
            defaultRowsPerPage={paginationParams.limit}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
          />
          </View>
        )}

        {/* ── Card View ── */}
        {viewMode === "card" && (
          <>
            {isLoading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2C64B3" />
              </View>
            ) : rows.length === 0 ? (
              <View className="flex-1 justify-center items-center pt-16">
                {/* <Text className="text-5xl mb-3">📡</Text> */}
                <Text className="text-[15px] text-gray-500 font-medium">
                  No devices found
                </Text>
              </View>
            ) : (
              <FlatList
                data={rows}
                keyExtractor={(item, index) =>
                  item?.id?.toString() ?? index.toString()
                }
                contentContainerStyle={{
                  paddingHorizontal: 12,
                  paddingBottom: 20,
                }}
                renderItem={({ item }) => (
                  <DeviceCard
                    row={item}
                    user={user}
                    getDotColor={getDotColor}
                    openMap={openMap}
                    setSettingsRow={setSettingsRow}
                    fetchDevices={fetchDevices}
                  />
                )}
                ListFooterComponent={
                  <Text className="text-center text-xs text-gray-400 py-2">
                    Showing {rows.length} of {totalRows} devices
                  </Text>
                }
              />
            )}
          </>
        )}
      </View>

      {/* ── Settings Modal ── */}
      {settingsRow && (
        <SettingsModal
          row={settingsRow}
          visible={!!settingsRow}
          onClose={() => setSettingsRow(null)}
          onRefetch={fetchDevices}
        />
      )}
    </View>
  );
};

export default UserDevices;