

export interface DeviceRow {
  id: number;
  devEUI: string;
  xNID: string;
  name: string;
  product_id: number;
  device_location: string;
  device_name: string;
  device_id: number;
  site_id: number;
  room_name: string;
  area_id: number;
  area_name: string;
  unit_name: string;
  voltage: number | null;
  humidity: number | null;
  temperature: number | null;
  reed_state: number | null;
  latitude: number | null;
  longitude: number | null;
  gatewayID: string | null;
  updated_at: string | null;
}

export type EditableField = "deviceLocation" | "deviceName";

export interface EditableCellProps {
  value: string;
  fieldKey: EditableField;
  row: DeviceRow;
  onRefetch: () => void;
}

export interface OptionsCellProps {
  row: DeviceRow;
  onSettingsPress: (row: DeviceRow) => void;
}

export interface SettingsModalProps {
  row: DeviceRow;
  visible: boolean;
  onClose: () => void;
  onRefetch: () => void;
}

export interface PaginationParams {
  currentPage: number;
  limit: number;
  searchInput: string;
}