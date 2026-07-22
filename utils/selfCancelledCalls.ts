// FIX (khud cancel karne par "Call declined" toast): jab caller khud apni
// outgoing call cancel karta hai (OutgoingCallOverlay.tsx ka sendCancel),
// backend se wapas usi caller ke apne channel par bhi ek CALL_REJECTED
// "echo" event aa jata hai. Us waqt tak OutgoingCallOverlay apna local
// `call` state clear kar chuka hota hai, is liye us event ka fallback
// handler (useIncomingCall.ts) use generic "declined" wording de deta tha -
// chahe caller ne khud hi cancel kiya ho, B ne decline nahi kiya tha.
//
// Ye chhota module-level tracker "maine abhi ye roomName khud cancel kiya
// hai" record karta hai (short TTL ke sath), taake baad mein aane wala
// apna hi echo event pehchana aur ignore kiya ja sake - koi galat/mismatched
// Toast na dikhe.
const selfCancelledRooms = new Map<string, number>();
const TTL_MS = 15000;

export function markSelfCancelled(roomName: string) {
  selfCancelledRooms.set(roomName, Date.now());
}

export function wasSelfCancelled(roomName: string | undefined | null): boolean {
  if (!roomName) return false;
  const ts = selfCancelledRooms.get(roomName);
  if (ts === undefined) return false;
  if (Date.now() - ts > TTL_MS) {
    selfCancelledRooms.delete(roomName);
    return false;
  }
  return true;
}