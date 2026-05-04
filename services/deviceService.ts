import { get } from "../api/apiHelper";

export const getDevicesList = async () => {
  // Fetch boats and devices separately (same as web)
  const [boatsRes, devicesRes] = await Promise.all([
    get("/api/boats/user/list"),
    get("/api/devices/users/list"),
  ]);

  // console.log("Fetched boats:", boatsRes);
  // console.log("Fetched devices:", devicesRes);

  const boats = boatsRes?.error
    ? []
    : (boatsRes?.data ?? []).map((boat: any) => ({
        device_id: boat?.id,
        device_name: boat?.boat_name,
        device_location: boat?.dock?.name,
        where_from: "marina",
        assign_entity_id: boat?.id,
        latitude: boat?.latitude,
        longitude: boat?.longitude,
      }));

  const devices = devicesRes?.error
    ? []
    : (devicesRes?.data ?? []).filter((d: any) => d?.where_from !== "marina");

  const combined = [...boats, ...devices];

  if (combined.length === 0) {
    return { success: false, data: [] };
  }

  return { success: true, data: combined };
};

export const getDeviceDetails = async (device: {
  device_id: number;
  where_from?: string;
  assign_entity_id?: number;
}) => {
  // Marina devices use boat_id, others use user_device_id (same as web)
  const path =
    device.where_from === "marina"
      ? `/api/boats/get-boat/attributes?boat_id=${device.assign_entity_id}`
      : `/api/boats/get-boat/attributes?user_device_id=${device.device_id}`;

  const response = await get(path);
  if (response?.error) return { success: false, data: null };
  return { success: true, data: response?.data };
};
