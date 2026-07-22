import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { post } from "../api/apiHelper";
import { Colors } from "../assets/Color";
import { useIncomingCall } from "../hooks/useIncomingCall";
import { useAuthStore } from "../store/authStore";
import { useCallStore } from "../store/callStore";

function getInitials(name: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function IncomingCallModal() {
  useIncomingCall();

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const incomingCall = useCallStore((s) => s.incomingCall);
  const clearIncomingCall = useCallStore((s) => s.clearIncomingCall);
  const setCallAccepted = useCallStore((s) => s.setCallAccepted);
  const setActiveRoomName = useCallStore((s) => s.setActiveRoomName);
  const clearOutgoingCall = useCallStore((s) => s.clearOutgoingCall);

  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    if (incomingCall) {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [incomingCall?.roomName]);

  // ─── Ringtone + vibration ───────────────────────────────────────────────
  // FIX (missing scenario — silent incoming call): is screen par pehle
  // koi audio ya vibration bilkul nahi tha. Agar phone pocket mein ho ya
  // user screen na dekh raha ho, unhe pata hi nahi chalta tha ke koi call
  // aa rahi hai. Ye asal mein caller ke "Ringing..." tone se bhi zyada
  // zaroori hai, kyunke yahi wo taraf hai jise genuinely alert hona chahiye.
  //
  // Vibration turant kaam karti hai (koi asset file nahi chahiye). Ringtone
  // ke liye asset file chahiye: assets/sounds/incoming-ringtone.mp3 - agar
  // file missing ho to sirf vibration hi chalti rahegi, crash nahi hoga.
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!incomingCall) return;

    // Real phone jaisa pattern: 700ms bajao, 700ms ruko, repeat - jab tak
    // call receive/decline na ho ya khatam na ho jaye.
    Vibration.vibrate([0, 700, 700], true);

    let cancelled = false;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("../assets/sounds/incoming-ringtone.mp3"),
          { isLooping: true, volume: 1.0 },
        );
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        await sound.playAsync();
      } catch (err) {
        console.log("[IncomingCallModal] ringtone failed to load/play (vibration still active):", err);
      }
    })();

    return () => {
      cancelled = true;
      Vibration.cancel();
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [incomingCall?.roomName]);
  // ──────────────────────────────────────────────────────────────────────

  // FIX (style): pehle ye ek chhota, light-theme popup card tha jo baaqi
  // call screens (CallingScreen ka dark theme) se match nahi karta tha.
  // Ab CallingScreen jaisa hi full-screen dark UI hai - pulsing avatar
  // ring, aur neeche side-by-side green Accept / red Decline buttons,
  // jaisa real phone call screen hota hai.
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!incomingCall) return;
    const makeLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    const l1 = makeLoop(pulse1, 0);
    const l2 = makeLoop(pulse2, 800);
    l1.start();
    l2.start();
    return () => {
      l1.stop();
      l2.stop();
    };
  }, [incomingCall?.roomName, pulse1, pulse2]);

  if (!incomingCall) return null;

  const ringStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
  });

  const handleAccept = () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    const { roomName, callerXnid, callerName } = incomingCall;
    clearIncomingCall();
    clearOutgoingCall();
    setCallAccepted(true);
    setActiveRoomName(roomName);

    const acceptPayload = {
      targetXnid: callerXnid,
      roomName,
      callerXnid: (user as any)?.email ?? "",
    };

    post("/api/call/accept", acceptPayload, {}, false).catch(() => {});

    router.push({
      pathname: "/(tabs)/call/[roomName]",
      params: {
        roomName,
        displayName: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User",
        xnid: (user as any)?.email ?? "",
        // FIX (hangup-reject kabhi fire nahi hota tha): [roomName].tsx route
        // calleeXnid/calleeName params expect karta hai - CallOverlay.tsx
        // isi se doosri taraf ko notify karta hai agar hangup "answered" se
        // pehle ho (permission-request/connecting phase). Callee ke
        // perspective se "doosri taraf" caller hai, is liye yahan
        // caller ka apna xnid/naam bhejte hain (naam confusing hai -
        // "calleeXnid" ka matlab hamesha "jise hangup pe notify karna hai"
        // hai, current user ke against wala party, chahe wo caller ho ya
        // callee).
        calleeXnid: callerXnid,
        calleeName: callerName,
        // NEW: is banda ne call receive ki hai (callee) - Screen2MeCall
        // isko dekh kar thoda intentional delay lagata hai room join karne
        // se pehle, taake caller (jo network round-trip ka wait kar raha
        // hai CALL_ACCEPTED event ke liye) hamesha pehle room join kare
        // aur moderator bane - bina delay ke, callee hamesha pehle pahunch
        // jata tha (local instant navigate vs caller ka network wait).
        isCaller: "0",
      },
    });
  };

  const handleDecline = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

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
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.status}>INCOMING CALL</Text>

          <View style={styles.avatarWrap}>
            <Animated.View style={[styles.ring, ringStyle(pulse1)]} />
            <Animated.View style={[styles.ring, ringStyle(pulse2)]} />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(incomingCall.callerName)}</Text>
            </View>
          </View>

          <Text style={styles.name}>{incomingCall.callerName}</Text>
          <Text style={styles.subtitle}>is calling…</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.actionCol}>
            <Pressable
              style={[styles.circleButton, styles.decline, processing && styles.buttonDisabled]}
              onPress={handleDecline}
              disabled={processing}
              hitSlop={12}
            >
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
            </Pressable>
            <Text style={styles.actionLabel}>Decline</Text>
          </View>

          <View style={styles.actionCol}>
            <Pressable
              style={[styles.circleButton, styles.accept, processing && styles.buttonDisabled]}
              onPress={handleAccept}
              disabled={processing}
              hitSlop={12}
            >
              <Ionicons name="call" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    justifyContent: "space-between",
    paddingTop: 90,
    paddingBottom: 60,
  },
  top: { alignItems: "center" },
  status: {
    color: "#9CA3AF",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 28,
  },
  avatarWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ring: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "700" },
  name: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 4 },
  subtitle: { color: "#9CA3AF", fontSize: 15, marginTop: 6 },
  bottom: { flexDirection: "row", justifyContent: "space-evenly" },
  actionCol: { alignItems: "center" },
  circleButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  accept: { backgroundColor: "#22C55E" },
  decline: { backgroundColor: "#E53935" },
  actionLabel: { color: "#9CA3AF", fontSize: 13 },
});