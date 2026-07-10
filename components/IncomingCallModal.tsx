import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
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
  const clearOutgoingCall = useCallStore((s) => s.clearOutgoingCall);

  // FIX (double-tap race): pehle Accept/Decline par koi guard nahi thi — ek
  // slow re-render ke doran dono taps almost simultaneously fire ho sakte
  // the (misal: user ne pehle Accept dabaya, phir turant galti se Decline
  // bhi chhoo liya), jis se accept + reject dono APIs chali jatin aur state
  // inconsistent ho jati (navigate bhi ho gaya, reject bhi chala gaya).
  // Ab pehla tap "processing" set kar deta hai, dusra koi bhi tap ignore
  // hota hai jab tak modal khud unmount na ho jaye (incomingCall clear).
  const [processing, setProcessing] = useState(false);
  // React state updates are async/batched — two very-fast taps can both
  // read `processing` as false before the first setState commits. A ref
  // is synchronous, so it actually blocks the second tap immediately.
  const processingRef = useRef(false);

  // FIX: ye component kabhi unmount nahi hota (root layout mein hamesha
  // mounted rehta hai) — sirf `incomingCall` null <-> populated hota rehta
  // hai. Is liye processingRef ko har NAYI call ke liye reset karna zaroori
  // hai, warna ek purani call accept/decline karne ke baad agli genuinely
  // nayi incoming call par bhi buttons hamesha disabled reh jate.
  useEffect(() => {
    if (incomingCall) {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [incomingCall?.roomName]);

  if (!incomingCall) return null;

  const handleAccept = () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    const { roomName, callerXnid } = incomingCall;
    clearIncomingCall();
    // Agar kisi wajah se mera apna koi outgoing attempt bhi pending tha
    // (edge case — normally glare us case ko useIncomingCall.ts mein hi
    // handle kar chuki hoti hai), yahan bhi safety ke liye clear kar do.
    clearOutgoingCall();
    setCallAccepted(true);
    setActiveRoomName(roomName);

    // FIX (ringing UX): caller ko batao ke call accept ho gayi hai, taake
    // unki "Calling..." screen turant [roomName] par transition ho jaye
    // (dekho hooks/useIncomingCall.ts -> acceptedCallback). Backend ko
    // /api/call/accept par ye event caller ke channel (user.{callerXnid})
    // par 'call.accepted' broadcast karna hoga.
    //
    // ─── DEBUG: pehle is call ka koi success log nahi tha — sirf error
    // hone par apiHelper generic "API Error:" print karta tha. Ab request
    // aur response dono explicitly print hote hain, taake ye confirm ho
    // sake ke backend ne request receive ki, kya status wapas bheja, aur
    // (agar backend response mein include karta hai) event fire hua ya
    // nahi — is se A (caller) side stuck hone ki asal wajah pinpoint karne
    // mein madad milegi.
    const acceptPayload = {
      targetXnid: callerXnid,
      roomName,
      callerXnid: (user as any)?.email ?? "",
    };
    console.log("[IncomingCallModal] 🚀 Calling /api/call/accept with payload:", JSON.stringify(acceptPayload));

    post("/api/call/accept", acceptPayload, {}, false)
      .then((res) => {
        console.log("[IncomingCallModal] ✅ /api/call/accept RESPONSE:", JSON.stringify(res));
      })
      .catch((err) => {
        console.log("[IncomingCallModal] ❌ /api/call/accept EXCEPTION:", err);
      });

    console.log("[IncomingCallModal] 🔀 Navigating myself (callee) into room:", roomName);
    router.push({
      pathname: "/(tabs)/call/[roomName]",
      params: {
        roomName,
        displayName: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User",
        xnid: (user as any)?.email ?? "",
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
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Incoming Call</Text>
          <Text style={styles.caller}>{incomingCall.callerName}</Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.decline, processing && styles.buttonDisabled]}
              onPress={handleDecline}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Decline</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.button, styles.accept, processing && styles.buttonDisabled]}
              onPress={handleAccept}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Accept</Text>
              )}
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
  buttonDisabled: {
    opacity: 0.6,
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