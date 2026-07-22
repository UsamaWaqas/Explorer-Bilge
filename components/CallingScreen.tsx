import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../assets/Color";

export type CallingVariant = "calling" | "busy" | "declined" | "no_answer";

interface CallingScreenProps {
  calleeName: string;
  onCancel: () => void;
  // NEW: jab caller ki call reject/busy/no-answer ho jaye, ye variant badal
  // kar user ko turant meaningful status dikhata hai, chup-chaap screen
  // change hone se pehle.
  variant?: CallingVariant;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const VARIANT_TEXT: Record<CallingVariant, { status: string; subtitle: string }> = {
  calling: { status: "Calling…", subtitle: "Ringing…" },
  busy: { status: "Unavailable", subtitle: "User is on another call" },
  declined: { status: "Call Declined", subtitle: "They declined your call" },
  no_answer: { status: "No Answer", subtitle: "They did not pick up" },
};

// FIX (professional polish for end states): pehle busy/declined/no_answer
// teeno sirf plain text se differentiate hote the (status + subtitle) - koi
// visual/iconography difference nahi thi, is liye teeno "same generic screen
// bas different words" jaisi lagti thi. Ab avatar ke corner par ek chhota,
// color-coded icon badge bhi hai jo pehli nazar mein hi batata hai ke exactly
// kya hua - real phone call-log jaisa (missed call = clock, declined = red X,
// busy = amber slash).
const VARIANT_BADGE: Record<CallingVariant, { icon: keyof typeof Ionicons.glyphMap; color: string } | null> = {
  calling: null,
  busy: { icon: "remove-circle", color: "#F59E0B" },
  declined: { icon: "close-circle", color: "#E53935" },
  no_answer: { icon: "time", color: "#6B7280" },
};

export function CallingScreen({ calleeName, onCancel, variant = "calling" }: CallingScreenProps) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const isRinging = variant === "calling";

  useEffect(() => {
    if (!isRinging) return;
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
  }, [pulse1, pulse2, isRinging]);

  const ringStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [
      { scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
    ],
  });

  const { status, subtitle } = VARIANT_TEXT[variant];
  const badge = VARIANT_BADGE[variant];
  const avatarColor = isRinging ? Colors.PRIMARY : "#6B7280";

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.status}>{status}</Text>

        <View style={styles.avatarWrap}>
          {isRinging && (
            <>
              <Animated.View style={[styles.ring, ringStyle(pulse1)]} />
              <Animated.View style={[styles.ring, ringStyle(pulse2)]} />
            </>
          )}
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(calleeName)}</Text>
          </View>
          {badge && (
            <View style={[styles.badge, { backgroundColor: badge.color }]}>
              <Ionicons name={badge.icon} size={16} color="#fff" />
            </View>
          )}
        </View>

        <Text style={styles.name}>{calleeName}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.bottom}>
        <Pressable style={styles.cancelButton} onPress={onCancel} hitSlop={12}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
        <Text style={styles.cancelLabel}>{isRinging ? "Cancel" : "Close"}</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "700" },
  badge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0B1220",
  },
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