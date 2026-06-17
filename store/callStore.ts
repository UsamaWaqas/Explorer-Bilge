import { create } from "zustand";

export interface IncomingCallData {
  roomName: string;
  callerName: string;
  callerXnid: string;
}

interface CallState {
  incomingCall: IncomingCallData | null;
  callAccepted: boolean;
  setIncomingCall: (data: IncomingCallData | null) => void;
  clearIncomingCall: () => void;
  setCallAccepted: (val: boolean) => void;
}

export const useCallStore = create<CallState>((set) => ({
  incomingCall: null,
  callAccepted: false,
  setIncomingCall: (data) => set({ incomingCall: data }),
  clearIncomingCall: () => set({ incomingCall: null }),
  setCallAccepted: (val) => set({ callAccepted: val }),
}));
