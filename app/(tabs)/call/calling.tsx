import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { post } from "../../../api/apiHelper";
import { CallingScreen } from "../../../components/CallingScreen";
import { useCallStore } from "../../../store/callStore";

// Real phone jaisa "no answer" timeout — itni der tak agar receiver
// Accept/Decline na kare to caller ko khud hi missed-call jaisa cancel kar do.
const RING_TIMEOUT_MS = 45000;

export default function CallingRouteScreen() {
  const router = useRouter();
  const { roomName, calleeName, calleeXnid, callerXnid, callerName } =
    useLocalSearchParams<{
      roomName: string;
      calleeName: string;
      calleeXnid: string;
      callerXnid: string;
      callerName: string;
    }>();

  const activeRoomName = useCallStore((s) => s.activeRoomName);
  const outgoingCall = useCallStore((s) => s.outgoingCall);
  const clearOutgoingCall = useCallStore((s) => s.clearOutgoingCall);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX: jab bhi CALL_ACCEPTED aata hai, global useIncomingCall hook khud
  // activeRoomName set karke [roomName] screen par navigate kar deta hai
  // (see hooks/useIncomingCall.ts -> acceptedCallback). Hum yahan sirf
  // detect karte hain ke ye ho chuka hai taake dobara navigate/cancel na ho.
  //
  // FIX (glare cleanup): agar hamara outgoingCall store se clear ho chuka
  // hai (ya kisi aur roomName par point kar raha hai) to iska matlab ye call
  // kisi aur tareeqe se already resolve ho chuki hai — misal ke taur par
  // glare-resolution (hooks/useIncomingCall.ts) ne isko khud reject/accept
  // kar diya. Aisi soorat mein bhi is screen ko apna 45s "no_answer" reject
  // nahi bhejna chahiye, warna ek already-resolved call ke liye stale
  // request chali jayegi.
  useEffect(() => {
    if (activeRoomName === roomName) {
      cancelledRef.current = true;
      return;
    }
    if (!outgoingCall || outgoingCall.roomName !== roomName) {
      cancelledRef.current = true;
    }
  }, [activeRoomName, outgoingCall, roomName]);

  const sendCancel = (reason: "cancelled" | "no_answer") => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    clearOutgoingCall();
    post(
      "/api/call/reject",
      {
        targetXnid: calleeXnid,
        roomName,
        callerName,
        callerXnid,
        reason,
      },
      {},
      false,
    ).catch(() => {});
  };

  const goBack = () => {
    router.replace("/(tabs)/call/contacts");
  };

  const handleCancel = () => {
    sendCancel("cancelled");
    goBack();
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      sendCancel("no_answer");
      Toast.show({
        type: "info",
        text1: "No answer",
        text2: `${calleeName} did not pick up.`,
      });
      goBack();
    }, RING_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CallingScreen calleeName={calleeName ?? "Contact"} onCancel={handleCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220" },
});