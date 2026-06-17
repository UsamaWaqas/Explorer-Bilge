import md5 from 'md5';

export const PUSHER_CONFIG = {
  appKey: process.env.EXPO_PUBLIC_PUSHER_APP_KEY!,
  cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: `${process.env.EXPO_PUBLIC_API_URL}broadcasting/auth`,
};

// Old channel (device data) — keep as is
export const getPusherChannelName = (userId: string | number) =>
  `notifi-sensor-data-${userId}`;

// New call channel — user.{md5(xnid)}
export const getCallChannelName = (xnid: string) =>
  `user.${md5(xnid)}`;

export const PUSHER_EVENTS = {
  DEVICE_DATA_UPDATED: 'device-data-updated',
  INCOMING_CALL: '.incoming.call',
  CALL_ACCEPTED: '.call.accepted',
} as const;
