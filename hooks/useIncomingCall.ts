import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import Toast from "react-native-toast-message";
import { post } from "../api/apiHelper";
import { getCallChannelName, PUSHER_EVENTS } from "../constants/pusher";
import { useAuthStore } from "../store/authStore";
import { useCallStore } from "../store/callStore";
import { usePusherStore } from "../store/pusherStore";

type CallbackFn = (e: { eventName: string; data: unknown }) => void;

export function useIncomingCall() {
  const { subscribe, unsubscribe, status } = usePusherStore();
  const user = useAuthStore((s) => s.user);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const setCallAccepted = useCallStore((s) => s.setCallAccepted);
  const setActiveRoomName = useCallStore((s) => s.setActiveRoomName);
  const clearOutgoingCall = useCallStore((s) => s.clearOutgoingCall);
  const channelRef = useRef<string | null>(null);
  const incomingCbRef = useRef<CallbackFn | null>(null);
  const acceptedCbRef = useRef<CallbackFn | null>(null);
  const rejectedCbRef = useRef<CallbackFn | null>(null);
  const router = useRouter();

  const realXnid = (user as any)?.email ?? null;

  useEffect(() => {
    if (!realXnid) return;
    if (status !== "connected") return;

    const channelName = getCallChannelName(realXnid);
    channelRef.current = channelName;

    const incomingCallback: CallbackFn = ({ eventName, data }) => {
      if (eventName !== PUSHER_EVENTS.INCOMING_CALL) return;

      const payload = data as {
        roomName?: string;
        callerName?: string;
        callerXnid?: string;
      };

      if (!payload?.roomName) return;
      if (payload?.callerXnid && payload.callerXnid === realXnid) return;

      // Agar user pehle se kisi active call mein hai (ya already ek
      // incoming call ka modal dikha rha hai, ya khud kisi ko call kar
      // raha hai — glare) to naya incoming call silently overwrite nahi
      // karna — warna current call/screen naye roomName pe re-render ho
      // kar purani call drop kar deta hai.
      const {
        activeRoomName,
        incomingCall: existingIncomingCall,
        outgoingCall,
      } = useCallStore.getState();

      if (activeRoomName || existingIncomingCall || outgoingCall) {
        // User busy hai — caller ko turant reject/busy bhej do taake
        // unka call hamesha ringing na rahe, aur current call untouched rahe.
        post(
          "/api/call/reject",
          {
            targetXnid: payload.callerXnid,
            roomName: payload.roomName,
            callerName: payload.callerName ?? "Unknown",
            callerXnid: payload.callerXnid ?? "",
            reason: "busy",
          },
          {},
          false,
        ).catch(() => {});
        return;
      }

      setIncomingCall({
        roomName: payload.roomName,
        callerName: payload.callerName ?? "Unknown",
        callerXnid: payload.callerXnid ?? "",
      });
    };

    const acceptedCallback: CallbackFn = ({ eventName, data }) => {
      if (eventName !== PUSHER_EVENTS.CALL_ACCEPTED) return;

      const payload = data as { roomName?: string };
      if (!payload?.roomName) return;

      // Agar user pehle se isi room mein active hai, ya kisi doosre
      // active call mein hai, to dobara navigate/re-render mat karo —
      // is se ongoing call ki WebView naye room pe chali jati thi.
      const { activeRoomName } = useCallStore.getState();
      if (activeRoomName && activeRoomName !== payload.roomName) return;
      if (activeRoomName === payload.roomName) return;

      // Caller ki "Calling…/Ringing…" screen ab resolve ho chuki hai —
      // clear karo taake wo screen apna 45s timeout kabhi fire na kare.
      clearOutgoingCall();

      const displayName =
        `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User";

      setActiveRoomName(payload.roomName);
      setCallAccepted(true);

      router.push({
        pathname: "/(tabs)/call/[roomName]",
        params: {
          roomName: payload.roomName,
          displayName,
          xnid: realXnid,
        },
      });
    };

    const rejectedCallback: CallbackFn = ({ eventName, data }) => {
      if (eventName !== PUSHER_EVENTS.CALL_REJECTED) return;

      setActiveRoomName(null);
      setCallAccepted(false);
      clearOutgoingCall();

      // Backend agar reason bhejta hai (busy vs manual decline vs no_answer)
      // to use dikhao, warna generic "declined" message. Caller ko pata
      // chalna chahiye ke agla banda busy tha - silently peeche navigate
      // hona kaafi nahi hai.
      const payload = data as { reason?: string } | undefined;
      const isBusy = payload?.reason === "busy";
      const isNoAnswer = payload?.reason === "no_answer";

      Toast.show({
        type: "info",
        text1: isBusy
          ? "User is busy"
          : isNoAnswer
            ? "No answer"
            : "Call declined",
        text2: isBusy
          ? "The person you called is on another call right now."
          : isNoAnswer
            ? "They did not pick up."
            : "Your call was not answered.",
      });

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/call/contacts");
      }
    };

    incomingCbRef.current = incomingCallback;
    acceptedCbRef.current = acceptedCallback;
    rejectedCbRef.current = rejectedCallback;

    subscribe(channelName, incomingCallback);
    subscribe(channelName, acceptedCallback);
    subscribe(channelName, rejectedCallback);

    return () => {
      if (channelRef.current) {
        if (incomingCbRef.current)
          unsubscribe(channelRef.current, incomingCbRef.current);
        if (acceptedCbRef.current)
          unsubscribe(channelRef.current, acceptedCbRef.current);
        if (rejectedCbRef.current)
          unsubscribe(channelRef.current, rejectedCbRef.current);
        channelRef.current = null;
      }
    };
  }, [realXnid, status]);
}
