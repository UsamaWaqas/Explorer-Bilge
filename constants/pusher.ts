export const PUSHER_CONFIG = {
  appKey: process.env.EXPO_PUBLIC_PUSHER_APP_KEY!,
  cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: `${process.env.EXPO_PUBLIC_API_URL}broadcasting/auth`,
};

export const getPusherChannelName = (userId: string | number) =>
  `notifi-sensor-data-${userId}`;

export const getCallChannelName = (xnid: string) =>
  `user.${xnid}`;

export const PUSHER_EVENTS = {
  DEVICE_DATA_UPDATED: 'device-data-updated',
  INCOMING_CALL: 'incoming.call',
  CALL_ACCEPTED: 'call.accepted',
  CALL_REJECTED: 'call.rejected',
  // NOTE: is event ka backend support abhi pending hai (Emil se coordinate
  // karna hai) — yahan sirf contract define kiya gaya hai jo frontend
  // already consume karne ke liye ready hai.
  // USER_STATUS_CHANGED: shared channel par broadcast hota hai jab koi user
  // call par busy ho ya free ho, taake contacts list mein real-time
  // "On call" badge dikh sake.
  USER_STATUS_CHANGED: 'user.status.changed',
} as const;

// Shared channel jise HAR logged-in user subscribe karta hai (sirf apna
// private channel nahi) taake dusron ka busy/available status mil sake.
// Backend jab bhi kisi call ko accept/end/reject karta hai, dono xNIDs ka
// naya status is channel par broadcast kare:
//   event: 'user.status.changed'
//   payload: { xnid: string, status: 'busy' | 'available', roomName?: string }
export const CALL_STATUS_CHANNEL = 'call-status';