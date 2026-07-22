import { create } from "zustand";

export interface IncomingCallData {
  roomName: string;
  callerName: string;
  callerXnid: string;
}

export interface OutgoingCallData {
  roomName: string;
  calleeXnid: string;
  calleeName: string;
  callerXnid: string;
  callerName: string;
}

// NEW: jab hamari outgoing call reject/busy/no-answer ho, useIncomingCall.ts
// yahan reason store karta hai (turant khud navigate/Toast nahi karta) -
// taake calling.tsx apni ringing UI ko pehle "Busy"/"Declined" mein badal
// sake, USER KO DIKHE, phir khud navigate kare. Single source of truth.
export interface CallEndInfo {
  roomName: string;
  reason: "busy" | "declined" | "no_answer" | "rejected" | null;
}

// NEW: persistent call overlay (CallOverlay.tsx) ke liye - ye poora call
// session describe karta hai jo Tabs ke bahar mounted rehta hai, is liye
// app ke andar kahin bhi navigate karo, call kabhi unmount/cut nahi hoti.
export interface ActiveCallData {
  roomName: string;
  displayName: string;
  xnid: string;
  calleeXnid?: string;
  calleeName?: string;
  // NEW: kaun call kar raha hai (true) vs kaun receive kar raha hai
  // (false) - moderator-priority join delay ke liye use hota hai
  // (see CallOverlay.tsx / Screen2MeCall.tsx joinDelayMs).
  isCaller?: boolean;
}

interface CallState {
  incomingCall: IncomingCallData | null;
  callAccepted: boolean;
  activeRoomName: string | null;
  outgoingCall: OutgoingCallData | null;
  callEndInfo: CallEndInfo | null;

  // NEW
  activeCall: ActiveCallData | null;
  isCallMinimized: boolean;

  setIncomingCall: (data: IncomingCallData | null) => void;
  clearIncomingCall: () => void;
  setCallAccepted: (val: boolean) => void;
  setActiveRoomName: (roomName: string | null) => void;
  setOutgoingCall: (data: OutgoingCallData | null) => void;
  clearOutgoingCall: () => void;
  setCallEndInfo: (info: CallEndInfo | null) => void;

  // NEW
  setActiveCall: (data: ActiveCallData | null) => void;
  clearActiveCall: () => void;
  setCallMinimized: (val: boolean) => void;
}

export const useCallStore = create<CallState>((set) => ({
  incomingCall: null,
  callAccepted: false,
  activeRoomName: null,
  outgoingCall: null,
  callEndInfo: null,
  activeCall: null,
  isCallMinimized: false,

  setIncomingCall: (data) => set({ incomingCall: data }),
  clearIncomingCall: () => set({ incomingCall: null }),
  setCallAccepted: (val) => set({ callAccepted: val }),
  setActiveRoomName: (roomName) => set({ activeRoomName: roomName }),
  setOutgoingCall: (data) => set({ outgoingCall: data }),
  clearOutgoingCall: () => set({ outgoingCall: null }),
  setCallEndInfo: (info) => set({ callEndInfo: info }),

  // NEW: setActiveCall/clearActiveCall activeRoomName + callAccepted ko bhi
  // sath hi sync rakhte hain — busy-glare detection (useIncomingCall.ts)
  // isi activeRoomName pe depend karta hai, is liye ek hi jagah se dono
  // update hona zaroori hai taake kabhi out-of-sync na hon.
  setActiveCall: (data) =>
    set({
      activeCall: data,
      activeRoomName: data?.roomName ?? null,
      callAccepted: !!data,
    }),
  clearActiveCall: () =>
    set({
      activeCall: null,
      isCallMinimized: false,
      activeRoomName: null,
      callAccepted: false,
    }),
  setCallMinimized: (val) => set({ isCallMinimized: val }),
}));