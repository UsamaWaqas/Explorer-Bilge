import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { post } from "../api/apiHelper";
import { Colors } from "../assets/Color";
import { useIncomingCall } from "../hooks/useIncomingCall";
import { useAuthStore } from "../store/authStore";
import { useCallStore } from "../store/callStore";

export default function IncomingCallModal() {
  useIncomingCall();

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const incomingCall = useCallStore((s) => s.incomingCall);
  const clearIncomingCall = useCallStore((s) => s.clearIncomingCall);
  const setCallAccepted = useCallStore((s) => s.setCallAccepted);
  const setActiveRoomName = useCallStore((s) => s.setActiveRoomName);

  if (!incomingCall) return null;

  const handleAccept = () => {
    const { roomName, callerXnid, callerName } = incomingCall;
    clearIncomingCall();
    setCallAccepted(true);
    setActiveRoomName(roomName);

    // FIX: previously nothing told the backend the call was actually
    // accepted — this is best-effort/fire-and-forget so a slow or failing
    // request never blocks the receiver from joining. (Backend endpoint
    // may still need to be added — confirm with backend team; until then
    // this call will just no-op/404 harmlessly.)
    post(
      "/api/call/accept",
      { roomName, targetXnid: callerXnid },
      {},
      false,
    ).catch(() => {});

    router.push({
      pathname: "/(tabs)/call/[roomName]",
      params: {
        roomName,
        displayName: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User",
        xnid: (user as any)?.email ?? "",
        // FIX (symmetric early-hangup notify): this is who [roomName].tsx
        // will notify with /api/call/reject if THIS side (the receiver)
        // hangs up before the call is genuinely connected. Previously this
        // was never passed, so a receiver hanging up early left the caller
        // stuck on "Connecting…" with no signal.
        calleeXnid: callerXnid,
        callerName,
      },
    });
  };

  const handleDecline = async () => {
    clearIncomingCall();
    try {
      await post(
        "/api/call/reject",
        {
          targetXnid: incomingCall.callerXnid,
          roomName: incomingCall.roomName,
          callerName: incomingCall.callerName,
          callerXnid: incomingCall.callerXnid,
        },
        {},
        false,
      );
    } catch {}
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Incoming Call</Text>
          <Text style={styles.caller}>{incomingCall.callerName}</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.decline]} onPress={handleDecline}>
              <Text style={styles.buttonText}>Decline</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.accept]} onPress={handleAccept}>
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  caller: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  accept: {
    backgroundColor: Colors.PRIMARY,
  },
  decline: {
    backgroundColor: "#E53935",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});