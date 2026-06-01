export const STORAGE_KEYS = {
  DEVICES: "devices_data",
  EVENTS: "events_data",
  TOKEN: "auth_token",
  SETTINGS: "app_settings",
  MONITORING: "monitoring_data",
  TIDES: "tides_data",
  LAST_SYNC: "last_sync_time",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
