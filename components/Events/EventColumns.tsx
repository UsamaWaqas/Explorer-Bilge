// src/components/events/EventColumns.tsx

import React, { useMemo } from "react";
import { Image, Text, View } from "react-native";
import {
  PacketRow,
  calculateElapsedTime,
  formatTempHumBat,
  formatTimeOnly,
  formatTimestamp,
  getEventDescription,
} from "../../utils/packetHelpers";
import { ColumnType } from "../Table";

const NetworkIcon = require("../../assets/NetworkIcon.png");

interface Props {
  rows: PacketRow[];
  getIsAlert: (row: PacketRow) => boolean;
  getAlertTimes: (index: number) => {
    isLastAlert: boolean;
    nextAlertTime: string | null;
  };
}

export const useEventColumns = ({ rows, getIsAlert, getAlertTimes }: Props): ColumnType<PacketRow>[] =>
  useMemo(
    () => [
      {
        key: "xNID" as keyof PacketRow,
        label: "xNID",
        width: 80,
        render: (row: PacketRow) => (
          <Text className="text-[11px] text-gray-900">{row.xNID ?? "---"}</Text>
        ),
      },
      {
        key: "updated_at" as keyof PacketRow,
        label: "Time Stamp",
        width: 150,
        render: (row: PacketRow) => (
          <Text className="text-[11px] text-gray-900">
            {formatTimestamp(row.updated_at)}
          </Text>
        ),
      },
      {
        key: "devEUI" as keyof PacketRow,
        label: "DEVEUI",
        width: 140,
        render: (row: PacketRow) => (
          <Text className="text-[11px] text-gray-900">{row.devEUI ?? "---"}</Text>
        ),
      },
      {
        key: "external_input" as keyof PacketRow,
        label: "Event Type",
        width: 120,
        render: (row: PacketRow) => {
          const isAlert = getIsAlert(row);
          return (
            <View
              className={`${isAlert ? "bg-red-500" : "bg-green-500"} rounded-lg py-0.5 px-2 self-center`}
            >
              <Text className="text-white text-[10px] font-semibold">
                {isAlert ? "ALERT" : "Check in"}
              </Text>
            </View>
          );
        },
      },
      {
        key: "reed_state" as keyof PacketRow,
        label: "Description",
        width: 180,
        render: (row: PacketRow) => {
          const isAlert = getIsAlert(row);
          console.log("usam;: ",row,getEventDescription(row))
          return (
            <Text
              className={`text-[11px] font-medium ${isAlert ? "text-red-500" : "text-green-500"}`}
            >
              {isAlert ? getEventDescription(row) : "Normal"}
            </Text>
          );
        },
      },
      {
        key: "temperature" as keyof PacketRow,
        label: "Temp, Hum, Bat",
        width: 150,
        render: (row: PacketRow) => (
          <Text className="text-[11px] text-gray-900">
            {formatTempHumBat(row)}
          </Text>
        ),
      },
      {
        key: "voltage" as keyof PacketRow,
        label: "Network",
        width: 80,
        render: (_row: PacketRow) => (
          <Image
            source={NetworkIcon}
            className="w-7 h-7"
            resizeMode="contain"
          />
        ),
      },
      {
        key: "gatewayID" as keyof PacketRow,
        label: "Gateway ID",
        width: 130,
        render: (row: PacketRow) => (
          <Text className="text-[11px] text-gray-900">{row.gatewayID ?? "---"}</Text>
        ),
      },
      {
        key: "id" as keyof PacketRow,
        label: "Elapsed",
        width: 120,
        render: (row: PacketRow) => {
          const isAlert = getIsAlert(row);
          if (!isAlert)
            return <Text className="text-[11px] text-gray-900">---</Text>;
          const index = rows.indexOf(row);
          const { isLastAlert, nextAlertTime } = getAlertTimes(index);
          return (
            <Text className="text-[11px] text-gray-900">
              {isLastAlert
                ? formatTimeOnly(row.updated_at)
                : nextAlertTime
                ? calculateElapsedTime(nextAlertTime, row.updated_at)
                : "---"}
            </Text>
          );
        },
      },
    ],
    [rows, getIsAlert, getAlertTimes]
  );