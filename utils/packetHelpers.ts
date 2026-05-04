// src/utils/packetHelpers.ts

import { EXTERNAL_INPUT_MESSAGES } from "../constants/packetConstants";

export interface PacketRow {
  id: string | number;
  xNID?: string;
  updated_at: string;
  devEUI?: string;
  external_input?: number | boolean | null;
  reed_state?: number | boolean | null;
  move?: number | boolean | null;
  temperature?: number | null;
  humidity?: number | null;
  voltage?: number | null;
  gatewayID?: string;
  product_id?: number;
  device_type_name?: string;
  notification_log?: {
    email_sent_to?: string[];
    sms_sent_to?: string[];
  } | null;
}

export interface PacketProduct {
  id: number;
  device_type_name?: string;
}

export interface PacketsApiResponse {
  xNID?: string;
  data: PacketRow[];
  total: number;
  last_page: number;
}

export function formatTimestamp(dateStr: string): string {
  if (!dateStr) return "---";
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${month}/${day} ${hh}:${mm}:${ss}`;
}

export function formatTimeOnly(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatTempHumBat(row: PacketRow): string {
  if (!row.temperature && !row.humidity && !row.voltage) return "---";
  const temp = row.temperature
    ? `${(((row.temperature as number) * 9) / 5 + 32).toFixed(1)}F`
    : "NA";
  const hum = row.humidity ? `${row.humidity}%` : "NA";
  const bat = row.voltage ? ((row.voltage as number) / 10).toFixed(1) : "3";
  return `${temp}, ${hum}, ${bat}`;
}

export function getEventDescription(row: PacketRow): string {
  // Web DataTable.jsx ke handleEventDescription se exact same logic
  const deviceTypeName = row.device_type_name;

  if (row.external_input === true || row.external_input === 1 || deviceTypeName === "BATTERY NOTIFI") {
    return EXTERNAL_INPUT_MESSAGES[deviceTypeName ?? ""] || "Alert Event";
  }
  if (row.move === true || row.move === 1) return "Motion Detected";
  if (row.reed_state === 0 || row.reed_state === false) return "Open Alarm Detected";
  return "Temperature out of range";
}

export function calculateElapsedTime(
  currentTime: string,
  previousTime: string,
): string {
  const diffMs =
    new Date(previousTime).getTime() - new Date(currentTime).getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
  const diffSeconds = Math.floor((diffMs % 60000) / 1000);
  if (diffHours > 0)
    return `${diffHours}hr ${diffMinutes}min ${diffSeconds}sec`;
  return `${diffMinutes}min ${diffSeconds}sec`;
}