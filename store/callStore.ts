import { create } from "zustand";

export interface IncomingCallData {
  roomName: string;
  callerName: string;
  callerXnid: string;
}

// FIX: outgoing-call state so the caller's "Calling…/Ringing…" screen
// (app/(tabs)/call/calling.tsx) and the glare-resolution logic in
// useIncomingCall.ts can agree on whether a call we placed is still
// waiting for an answer.
export interface OutgoingCallData {
  roomName: string;
  calleeXnid: string;
  calleeName: string;
  callerXnid: string;
  callerName: string;
}

interface CallState {
  incomingCall: IncomingCallData | null;
  callAccepted: boolean;
  activeRoomName: string | null;

  // FIX: tracks a call we placed that hasn't been answered/declined yet.
  outgoingCall: OutgoingCallData | null;

  setIncomingCall: (data: IncomingCallData | null) => void;
  clearIncomingCall: () => void;
  setCallAccepted: (val: boolean) => void;
  setActiveRoomName: (roomName: string | null) => void;
  setOutgoingCall: (data: OutgoingCallData | null) => void;
  clearOutgoingCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  incomingCall: null,
  callAccepted: false,
  activeRoomName: null,
  outgoingCall: null,
  setIncomingCall: (data) => set({ incomingCall: data }),
  clearIncomingCall: () => set({ incomingCall: null }),
  setCallAccepted: (val) => set({ callAccepted: val }),
  setActiveRoomName: (roomName) => set({ activeRoomName: roomName }),
  setOutgoingCall: (data) => set({ outgoingCall: data }),
  clearOutgoingCall: () => set({ outgoingCall: null }),
}));