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

  // ─── DEBUG: confirm this screen actually mounted with the params we
  // expect. If roomName here doesn't match what contacts.tsx sent in the
  // invite, or what useIncomingCall.ts later receives in call.accepted,
  // that alone explains a stuck screen.
  useEffect(() => {
    console.log("############################################################");
    console.log("[CallingScreen] MOUNTED");
    console.log("[CallingScreen] roomName param:", roomName);
    console.log("[CallingScreen] calleeName:", calleeName, "| calleeXnid:", calleeXnid);
    console.log("[CallingScreen] callerName:", callerName, "| callerXnid:", callerXnid);
    console.log("[CallingScreen] store.outgoingCall at mount:", JSON.stringify(useCallStore.getState().outgoingCall));
    console.log("[CallingScreen] store.activeRoomName at mount:", useCallStore.getState().activeRoomName);
    console.log("############################################################");

    return () => {
      console.log("[CallingScreen] UNMOUNTED — roomName was:", roomName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── DEBUG: this is the exact effect that's supposed to catch
  // call.accepted and stop the ring-timeout from firing later. Log every
  // time activeRoomName or outgoingCall changes while this screen is up,
  // so we can see precisely what state this screen believes it's in at
  // any moment.
  useEffect(() => {
    console.log(
      "[CallingScreen] state change — activeRoomName:", activeRoomName,
      "| outgoingCall:", JSON.stringify(outgoingCall),
      "| my roomName:", roomName,
    );

    if (activeRoomName === roomName) {
      console.log("[CallingScreen] ✅ activeRoomName now matches my roomName — call was accepted, marking cancelledRef=true.");
      cancelledRef.current = true;
      return;
    }
    if (!outgoingCall || outgoingCall.roomName !== roomName) {
      console.log("[CallingScreen] ⚠️ outgoingCall no longer matches my roomName (cleared or superseded elsewhere) — marking cancelledRef=true.");
      cancelledRef.current = true;
    }
  }, [activeRoomName, outgoingCall, roomName]);

  const sendCancel = (reason: "cancelled" | "no_answer") => {
    if (cancelledRef.current) {
      console.log("[CallingScreen] sendCancel(" + reason + ") called but cancelledRef already true — skipping duplicate send.");
      return;
    }
    console.log("[CallingScreen] 📤 Sending /api/call/reject reason:", reason, "| roomName:", roomName, "| targetXnid:", calleeXnid);
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
    )
      .then((res) => console.log("[CallingScreen] reject API response:", JSON.stringify(res)))
      .catch((err) => console.log("[CallingScreen] reject API error:", err));
  };

  const goBack = () => {
    console.log("[CallingScreen] goBack() — navigating to contacts");
    router.replace("/(tabs)/call/contacts");
  };

  const handleCancel = () => {
    console.log("[CallingScreen] User tapped Cancel button");
    sendCancel("cancelled");
    goBack();
  };

  useEffect(() => {
    console.log("[CallingScreen] Starting", RING_TIMEOUT_MS, "ms no-answer timer for roomName:", roomName);
    timeoutRef.current = setTimeout(() => {
      console.log("[CallingScreen] ⏰ RING TIMEOUT FIRED for roomName:", roomName, "| cancelledRef:", cancelledRef.current);
      if (cancelledRef.current) {
        console.log("[CallingScreen] Timeout fired but cancelledRef already true — call was already resolved, doing nothing.");
        return;
      }
      console.log("[CallingScreen] ❌ Treating as NO ANSWER — sending reject + navigating back.");
      sendCancel("no_answer");
      Toast.show({
        type: "info",
        text1: "No answer",
        text2: `${calleeName} did not pick up.`,
      });
      goBack();
    }, RING_TIMEOUT_MS);

    return () => {
      console.log("[CallingScreen] Clearing no-answer timer for roomName:", roomName);
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