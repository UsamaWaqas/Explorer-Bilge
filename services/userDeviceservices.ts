import { get, post, put } from "../api/apiHelper";
import { AlarmProduct } from "../types/Alarm.types";
import { DeviceRow } from "../types/UserDevices.types";

// ─── Fetch Products (for alarm check) ────────────────────────────────────────

export const fetchProductsByUserService = async (
  userId: number,
): Promise<AlarmProduct[]> => {
  const res = await get(`/api/deviceTypes/getDeviceTypesByUserId/${userId}`);
  if (res?.error) return [];
  return res?.data ?? [];
};

// ─── Fetch Devices ────────────────────────────────────────────────────────────

export const fetchDevicesService = async (
  userId: number,
  currentPage: number,
  limit: number,
  searchInput: string,
): Promise<DeviceRow[]> => {
  const res = await get(`/api/device-values/user/${userId}/device-type`, {
    limit,
    offset: (currentPage - 1) * limit,
    search: searchInput,
  });

  if (res?.error) return [];
  return res?.data?.data ?? [];
};

// ─── Update Device Location ───────────────────────────────────────────────────

export const updateDeviceLocationService = async (
  inventoryDeviceId: number,
  updatedValue: string,
  areaId: number,
): Promise<boolean> => {
  const res = await put("/api/device-location", {
    inventory_device_id: inventoryDeviceId,
    updated_value: updatedValue,
    area_id: areaId,
  });

  return !res?.error;
};

// ─── Update Device Name ───────────────────────────────────────────────────────

export const updateDeviceNameService = async (
  inventoryDeviceId: number,
  updatedValue: string,
  siteId: number,
): Promise<boolean> => {
  const res = await put("/api/device-name", {
    inventory_device_id: inventoryDeviceId,
    updated_value: updatedValue,
    site_id: siteId,
  });

  return !res?.error;
};

// ─── Fetch Device Notification Settings ──────────────────────────────────────

export const fetchDeviceNotificationService = async (deviceId: number) => {
  const res = await get(`/api/get-device/notification/address/${deviceId}`);

  if (res?.success === true) {
    return {
      notificationEmail: res?.data?.notification_email ?? "",
      notificationNumber: res?.data?.notification_phone_number ?? "",
    };
  }

  return { notificationEmail: "", notificationNumber: "" };
};

// ─── Fetch Device Toggle Status ───────────────────────────────────────────────

export const fetchDeviceToggleStatusService = async (
  deviceId: number,
): Promise<boolean> => {
  const res = await get(`/api/devices/toggle-status/${deviceId}`);
  console.log("toggle response", res);

  if (res?.status == 200) {
    return !!res?.toggle_status;
  }

  return false;
};

// ─── Toggle Device Alert ──────────────────────────────────────────────────────

export const toggleDeviceAlertService = async (
  deviceId: number,
): Promise<void> => {
  await get(`/api/devices/toggle/${deviceId}`);
};

// ─── Update Device Notification Address ──────────────────────────────────────

export const updateDeviceNotificationService = async (
  deviceId: number,
  notificationEmail: string,
  notificationNumber: string,
): Promise<boolean> => {
  const res = await post(
    `/api/update-device/notification/address/${deviceId}`,
    { notificationEmail, notificationNumber },
  );

  return !res?.error;
};
