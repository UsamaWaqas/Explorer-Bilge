export interface Device {
  device_id: number;
  device_name: string;
  device_location: string;
  where_from?: string;
  assign_entity_id: number;
  latitude: number | null;
  longitude: number | null;
}

export interface DeviceOption {
  label: string;
  value: string;
  raw: Device;
}

export interface MonitoringCache {
  tilesConfig: any[];
  alertCount: number | null;
  isArmed: boolean;
}

export interface TidesCache {
  first: string;
  second: string;
  third: string;
  fourth: string;
  next: string;
}