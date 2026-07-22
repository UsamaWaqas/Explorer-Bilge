import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import Toast from "react-native-toast-message";
import { post } from "../api/apiHelper";
import { getCallChannelName, PUSHER_EVENTS } from "../constants/pusher";
import { useAuthStore } from "../store/authStore";
import { useCallStore } from "../store/callStore";
import { usePusherStore } from "../store/pusherStore";
import { wasSelfCancelled } from "../utils/selfCancelledCalls";

type CallbackFn = (e: { eventName: string; data: unknown }) => void;

export function useIncomingCall() {
  const { subscribe, unsubscribe, status } = usePusherStore();
  const user = useAuthStore((s) => s.user);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const clearIncomingCall = useCallStore((s) => s.clearIncomingCall);
  const setCallAccepted = useCallStore((s) => s.setCallAccepted);
  const setActiveRoomName = useCallStore((s) => s.setActiveRoomName);
  const clearOutgoingCall = useCallStore((s) => s.clearOutgoingCall);
  const setCallEndInfo = useCallStore((s) => s.setCallEndInfo);
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

      const {
        activeRoomName,
        incomingCall: existingIncomingCall,
        outgoingCall,
      } = useCallStore.getState();

      if (activeRoomName || existingIncomingCall || outgoingCall) {
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

      const { activeRoomName, outgoingCall } = useCallStore.getState();
      if (activeRoomName && activeRoomName !== payload.roomName) return;
      if (activeRoomName === payload.roomName) return;

      // FIX (hangup-reject kabhi fire nahi hota tha): [roomName].tsx route
      // calleeXnid/calleeName params expect karta hai (CallOverlay.tsx ke
      // handleHangUp mein isi se doosri taraf ko reject-notify kiya jata
      // hai agar call abhi "answered" nahi hui - jaise permission-request
      // ya connecting phase ke doran hangup ho jaye). Pehle ye do params
      // yahan bilkul pass hi nahi hote the, is liye activeCall.calleeXnid
      // hamesha undefined rehta tha aur wo notification kabhi bhejta hi
      // nahi tha. outgoingCall (jo contacts.tsx se yahan tak zinda hai)
      // mein calleeXnid/calleeName already maujood hain - clear karne se
      // PEHLE nikaal lete hain.
      const calleeXnid = outgoingCall?.calleeXnid;
      const calleeName = outgoingCall?.calleeName;

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
          calleeXnid,
          calleeName,
          // NEW: is banda ne call KI thi (caller) - moderator-priority
          // join ke liye Screen2MeCall ko bataya jata hai ke ye jaldi
          // (bina extra delay ke) room join kare.
          isCaller: "1",
        },
      });
    };

    // FIX (busy UX): pehle ye callback khud hi Toast dikha kar turant
    // navigate kar deta tha — is se caller ko "Busy" ka status kabhi
    // dikhta hi nahi tha, screen turant badal jati thi. Ab ye sirf reason
    // ko store mein daal deta hai; calling.tsx (jo abhi is roomName ki
    // ringing screen dikha raha hota hai) khud is field ko watch karta hai,
    // apni UI "Busy"/"Declined" mein badalta hai, phir khud Toast + navigate
    // karta hai. Fallback timer safety ke liye - agar calling.tsx kisi
    // wajah se mounted na ho (rare), to yahin se Toast+navigate ho jaye,
    // taake user kabhi bhi silently atka na rahe.
    const rejectedCallback: CallbackFn = ({ eventName, data }) => {
      if (eventName !== PUSHER_EVENTS.CALL_REJECTED) return;

      const payload = data as { roomName?: string; reason?: string } | undefined;
      const roomName = payload?.roomName ?? "";
      const reason = (payload?.reason as any) ?? "declined";

      // FIX (khud cancel karne par galat "Call declined" toast): agar
      // MAINE hi ye call cancel ki thi (OutgoingCallOverlay.tsx se), to ye
      // event sirf uska apna echo hai - maine already apna UI/navigation
      // local action se handle kar diya hai. Isko yahan dubara process
      // karna hi galat "declined" wording ki wajah tha (neeche "declined"
      // hamesha default hota tha jab reason "busy"/"no_answer" na ho -
      // "cancelled" isi default mein gir jata tha).
      if (wasSelfCancelled(roomName)) return;

      // FIX (stuck incoming-call modal): agar is event ka roomName meri
      // IncomingCallModal wali call se match karta hai, iska matlab main
      // CALLEE hoon aur caller ne mere Accept/Decline dabane se PEHLE hi
      // call cancel kar di. Pehle ye case yahan bilkul handle nahi hota
      // tha — sirf outgoingCall/activeRoomName clear hote the (jo caller
      // ki apni ringing screen ke liye hain), incomingCall ko koi haath
      // hi nahi laga raha tha. Is wajah se IncomingCallModal hamesha
      // screen par atka reh jata tha jab tak khud Accept/Decline na dabao
      // — chahe dusra banda kabhi ka call cancel kar chuka ho.
      const currentIncoming = useCallStore.getState().incomingCall;
      if (currentIncoming && currentIncoming.roomName === roomName) {
        clearIncomingCall();
        if (reason === "cancelled") {
          Toast.show({
            type: "info",
            text1: "Missed call",
            text2: `${currentIncoming.callerName} cancelled the call.`,
          });
        }
        return;
      }

      setActiveRoomName(null);
      setCallAccepted(false);
      clearOutgoingCall();
      setCallEndInfo({ roomName, reason });

      setTimeout(() => {
        const stillPending = useCallStore.getState().callEndInfo;
        if (!stillPending || stillPending.roomName !== roomName) return; // consumed already

        // OutgoingCallOverlay.tsx ne is event ko consume nahi kiya (rare -
        // ho sakta hai overlay abhi mount hi na hua ho) - fallback dikhao.
        useCallStore.getState().setCallEndInfo(null);
        const isBusy = reason === "busy";
        const isNoAnswer = reason === "no_answer";
        // FIX (mismatched message): "declined" ke liye pehle yahan bhi
        // "Your call was not answered." dikhta tha, jo "Call declined"
        // (text1) ke sath contradict karta tha - isi wajah se do alag
        // messages ek sath ajeeb lagte the. Ab "declined" reason ke liye
        // clearly "declined" hi bola jata hai, "not answered" nahi.
        Toast.show({
          type: "info",
          text1: isBusy ? "User is busy" : isNoAnswer ? "No answer" : "Call declined",
          text2: isBusy
            ? "The person you called is on another call right now."
            : isNoAnswer
              ? "They did not pick up."
              : "They declined your call.",
        });
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)/call/contacts");
        }
      }, 2500);
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