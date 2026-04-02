import { get } from "../api/apiHelper";

export const getDevicesList = async () => {
  const response = await get("/api/devices/users/list");

  console.log("Devices List Response:", response);

  if (response?.error) {
    return { success: false, data: [] };
  }

  return { success: true, data: response?.data || [] };
};


export const getDeviceDetails = async (userDeviceId: number) => {
  const response = await get(`/api/boats/get-boat/attributes?user_device_id=${userDeviceId}`);
  if (response?.error) return { success: false, data: null };
  return { success: true, data: response?.data };
};
