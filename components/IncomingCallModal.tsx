import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../assets/Color";
import { useCallStore } from "../store/callStore";
import { useIncomingCall } from "../hooks/useIncomingCall";

// Mount this once near the root (e.g. inside (tabs)/_layout.tsx) so it can
// pop up over any screen when an "incoming-call" Pusher event arrives.
export default function IncomingCallModal() {
  useIncomingCall();

  const router = useRouter();
  const incomingCall = useCallStore((s) => s.incomingCall);
  const clearIncomingCall = useCallStore((s) => s.clearIncomingCall);

  if (!incomingCall) return null;

  const handleAccept = () => {
    const { roomName } = incomingCall;
    clearIncomingCall();
    router.push({
      pathname: "/(tabs)/call/[roomName]",
      params: {
        roomName,
        displayName: "User", // profile screen passes the real display name on outgoing calls
        xnid: "", // Screen2MeCall falls back gracefully if empty
      },
    });
  };

  const handleDecline = () => {
    clearIncomingCall();
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