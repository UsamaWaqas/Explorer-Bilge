import { useEffect, useRef } from "react";
import { getCallChannelName, PUSHER_EVENTS } from "../constants/pusher";
import { useAuthStore } from "../store/authStore";
import { useCallStore } from "../store/callStore";
import { usePusherStore } from "../store/pusherStore";
import { useRouter } from "expo-router";

type CallbackFn = (e: { eventName: string; data: unknown }) => void;

export function useIncomingCall() {
  const { subscribe, unsubscribe, status } = usePusherStore();
  const user = useAuthStore((s) => s.user);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const setCallAccepted = useCallStore((s) => s.setCallAccepted);
  const channelRef = useRef<string | null>(null);
  const incomingCbRef = useRef<CallbackFn | null>(null);
  const acceptedCbRef = useRef<CallbackFn | null>(null);
  const router = useRouter();

  useEffect(() => {
    const xnid = user?.Xnid ?? String(user?.id ?? "");
    if (!xnid || status !== "connected") return;

    const channelName = getCallChannelName(xnid);
    channelRef.current = channelName;

    // --- .incoming.call ---
    const incomingCallback: CallbackFn = ({ eventName, data }) => {
      if (eventName !== PUSHER_EVENTS.INCOMING_CALL) return;
      const payload = data as {
        roomName?: string;
        callerName?: string;
        callerXnid?: string;
      };
      if (!payload?.roomName) {
        console.warn("[IncomingCall] payload missing roomName:", payload);
        return;
      }
      setIncomingCall({
        roomName: payload.roomName,
        callerName: payload.callerName ?? "Unknown",
        callerXnid: payload.callerXnid ?? "",
      });
    };

    // --- .call.accepted ---
    const acceptedCallback: CallbackFn = ({ eventName, data }) => {
      if (eventName !== PUSHER_EVENTS.CALL_ACCEPTED) return;
      const payload = data as { roomName?: string };
      if (!payload?.roomName) return;

      // Caller ko room mein le jao
      const xnidVal = user?.Xnid ?? String(user?.id ?? "");
      const displayName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User";
      router.push({
        pathname: "/(tabs)/call/[roomName]",
        params: {
          roomName: payload.roomName,
          displayName,
          xnid: xnidVal,
        },
      });
    };

    incomingCbRef.current = incomingCallback;
    acceptedCbRef.current = acceptedCallback;

    subscribe(channelName, incomingCallback);
    subscribe(channelName, acceptedCallback);

    return () => {
      if (channelRef.current) {
        if (incomingCbRef.current) unsubscribe(channelRef.current, incomingCbRef.current);
        if (acceptedCbRef.current) unsubscribe(channelRef.current, acceptedCbRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, status]);
}
