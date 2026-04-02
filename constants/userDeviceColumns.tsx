import { ColumnType } from "@/components/Table";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import EditableCell from "../components/devices/EditableCell";
import EventDot from "../components/devices/EventDot";
import OptionsCell from "../components/devices/OptionsCell";
import { DeviceRow } from "../types/UserDevices.types";
import { formatTempHumBat, formatTimestamp } from "../utils/Devicehelpers";

interface ColumnDeps {
  user: { title?: string } | null;
  fetchDevices: () => void;
  openMap: (row: DeviceRow) => void;
  getDotColor: (row: DeviceRow) => string;
  setSettingsRow: (row: DeviceRow) => void;
}

export function getUserDeviceColumns({
  user,
  fetchDevices,
  openMap,
  getDotColor,
  setSettingsRow,
}: ColumnDeps): ColumnType<DeviceRow>[] {
  return [
    {
      key: "device_id" as keyof DeviceRow,
      label: "Latest Event",
      width: 90,
      render: (row) => <EventDot color={getDotColor(row)} />,
    },
    {
      key: "xNID" as keyof DeviceRow,
      label: "xNID",
      width: 140,
      render: (row) => (
        <Text style={{ fontSize: 11, color: "#111827" }}>{row.xNID ?? "---"}</Text>
      ),
    },
    {
      key: "name" as keyof DeviceRow,
      label: "Device ID",
      width: 150,
      render: (row) => (
        <Text style={{ fontSize: 11, color: "#111827" }}>{row.name ?? "---"}</Text>
      ),
    },
    ...(user?.title !== "Customer"
      ? [
          {
            key: "unit_name" as keyof DeviceRow,
            label: "Unit",
            width: 110,
            render: (row: DeviceRow) => (
              <Text style={{ fontSize: 11, color: "#111827" }}>
                {row.unit_name ?? "---"}
              </Text>
            ),
          },
        ]
      : []),
    {
      key: "area_name" as keyof DeviceRow,
      label: "Device Location",
      width: 170,
      render: (row) => (
        <EditableCell
          value={row.area_name ?? row.device_location ?? ""}
          fieldKey="deviceLocation"
          row={row}
          onRefetch={fetchDevices}
        />
      ),
    },
    {
      key: "room_name" as keyof DeviceRow,
      label: "Device Name",
      width: 170,
      render: (row) => (
        <EditableCell
          value={row.room_name ?? row.device_name ?? ""}
          fieldKey="deviceName"
          row={row}
          onRefetch={fetchDevices}
        />
      ),
    },
    {
      key: "updated_at" as keyof DeviceRow,
      label: "Time Stamp",
      width: 150,
      render: (row) => (
        <Text style={{ fontSize: 11, color: "#111827" }}>
          {formatTimestamp(row.updated_at)}
        </Text>
      ),
    },
    {
      key: "temperature" as keyof DeviceRow,
      label: "Temp, Hum, Bat",
      width: 140,
      render: (row) => (
        <Text style={{ fontSize: 11, color: "#111827" }}>
          {formatTempHumBat(row)}
        </Text>
      ),
    },
    {
      key: "gatewayID" as keyof DeviceRow,
      label: "Gateway ID",
      width: 160,
      render: (row) => (
        <Text style={{ fontSize: 11, color: "#111827" }}>
          {row.gatewayID ?? "---"}
        </Text>
      ),
    },
    {
      key: "latitude" as keyof DeviceRow,
      label: "Geo Location",
      width: 100,
      render: (row) =>
        row.latitude && row.longitude ? (
          <TouchableOpacity onPress={() => openMap(row)}>
            <Ionicons name="location" size={20} color="#2563eb" />
          </TouchableOpacity>
        ) : (
          <Text style={{ fontSize: 11, color: "#111827" }}>---</Text>
        ),
    },
    {
      key: "id" as keyof DeviceRow,
      label: "Options",
      width: 90,
      render: (row) => (
        <OptionsCell row={row} onSettingsPress={setSettingsRow} />
      ),
    },
  ];
}