export const PUSHER_CONFIG = {
  appKey: process.env.EXPO_PUBLIC_PUSHER_APP_KEY!,
  cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: `${process.env.EXPO_PUBLIC_API_URL}broadcasting/auth`,
};

export const getPusherChannelName = (userId: string | number) =>
  `notifi-sensor-data-${userId}`;

export const PUSHER_EVENTS = {
  DEVICE_DATA_UPDATED: "device-data-updated",
} as const;
