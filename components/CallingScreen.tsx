import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../assets/Color";

interface CallingScreenProps {
  calleeName: string;
  onCancel: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Native, phone-call-jaisi "Calling..." screen. Jab tak dusra banda Accept
// ya Decline na kare, user ko seedha Jitsi WebView ke "Connecting..." mein
// nahi dhakelte — is se call "loading atki hui" ke bajaye "ring ho rahi hai"
// jaisi mehsoos hoti hai, jaisa normal phone calls mein hota hai.
export function CallingScreen({ calleeName, onCancel }: CallingScreenProps) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [pulse1, pulse2]);

  const ringStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [
      { scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
    ],
  });

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.status}>Calling…</Text>

        <View style={styles.avatarWrap}>
          <Animated.View style={[styles.ring, ringStyle(pulse1)]} />
          <Animated.View style={[styles.ring, ringStyle(pulse2)]} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(calleeName)}</Text>
          </View>
        </View>

        <Text style={styles.name}>{calleeName}</Text>
        <Text style={styles.subtitle}>Ringing…</Text>
      </View>

      <View style={styles.bottom}>
        <Pressable style={styles.cancelButton} onPress={onCancel} hitSlop={12}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
        <Text style={styles.cancelLabel}>Cancel</Text>
      </View>
    </View>
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
    backgroundColor: Colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "700" },
  name: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 4 },
  subtitle: { color: "#9CA3AF", fontSize: 15, marginTop: 6 },
  bottom: { alignItems: "center" },
  cancelButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cancelLabel: { color: "#9CA3AF", fontSize: 13 },
});