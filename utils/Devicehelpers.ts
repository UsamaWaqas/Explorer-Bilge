import { DeviceRow } from "../types/UserDevices.types";

export function isGreaterThan24Hours(time: string | null): boolean {
  if (!time) return true;
  return (Date.now() - new Date(time).getTime()) / (1000 * 60 * 60) > 24;
}

export function formatTimestamp(ts: string | null): string {
  if (!ts) return "---";
  return new Date(ts)
    .toLocaleString("en-US", {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(",", "");
}

export function formatTempHumBat(row: DeviceRow): string {
  if (!row.temperature && !row.humidity && !row.voltage) return "---";
  const temp = row.temperature
    ? `${(((row.temperature * 9) / 5) + 32).toFixed(1)}F`
    : "NA";
  const hum = row.humidity ? `${row.humidity}%` : "NA";
  const bat = row.voltage ? (row.voltage / 10).toFixed(1) : "3";
  return `${temp}, ${hum}, ${bat}`;
}