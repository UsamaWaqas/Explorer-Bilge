import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Easing, Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { post } from "../api/apiHelper";
import { Colors } from "../assets/Color";
import { CallingScreen, CallingVariant } from "./CallingScreen";
import { buildScreen2MeUrl } from "./Screen2MeCall";
import { useCallStore } from "../store/callStore";
import { markSelfCancelled } from "../utils/selfCancelledCalls";

const RING_TIMEOUT_MS = 45000;
const END_STATE_DISPLAY_MS = 1800;

function getInitials(name: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// FIX (full-screen bug): pehle ye poora UI app/(tabs)/call/calling.tsx mein
// tha - ek NORMAL Tabs route. Is wajah se ye <Tabs> ke andar render hota
// tha, aur app ka persistent <Header /> ((tabs)/_layout.tsx mein, Tabs se
// UPAR mounted) hamesha is ke upar dikhta rehta tha - "CALLING..." screen
// header ke NEECHE dikhti thi, poori tarah full-screen kabhi nahi hoti thi.
//
// Ab ye bilkul CallOverlay.tsx jaisa hi mounted hai - (tabs)/_layout.tsx
// mein <Tabs> ke BAHAR, position: absolute + zIndex 999 ke sath - is liye
// Header sameet HAR cheez ko cover karta hai, aur navigation se kabhi
// unmount bhi nahi hota. contacts.tsx ab sirf setOutgoingCall() call karta
// hai - kahin navigate nahi karta - ye overlay khud hi upar aa jata hai.
export default function OutgoingCallOverlay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const outgoingCall = useCallStore((s) => s.outgoingCall);
  const clearOutgoingCall = useCallStore((s) => s.clearOutgoingCall);
  const activeRoomName = useCallStore((s) => s.activeRoomName);
  const callEndInfo = useCallStore((s) => s.callEndInfo);
  const setCallEndInfo = useCallStore((s) => s.setCallEndInfo);

  // outgoingCall clear hone ke baad bhi (busy/declined/no_answer dikhane ke
  // doran) UI zinda rakhne ke liye apna snapshot rakhte hain.
  const [call, setCall] = useState(typeof outgoingCall === "object" ? outgoingCall : null);
  const [endVariant, setEndVariant] = useState<CallingVariant | null>(null);
  // FIX (back button on ringing screen — banner, not cancel): pehle back
  // press seedha call cancel kar deta tha, jo galti se dabne par bhi
  // outgoing call khatam kar deta. Ab back press call ko MINIMIZE kar deta
  // hai ek chhoti top banner mein (bubble jaisi drag-around cheez nahi -
  // sirf ek fixed status bar, jaisa Android/iOS ka native "tap to return
  // to call" indicator) - call ringing chalti rehti hai background mein,
  // user kahin bhi navigate kar sakta hai, aur banner tap kar ke wapas
  // full-screen ringing UI par aa sakta hai. Cancel sirf explicit red
  // button (full-screen ya banner ke apne chhote cancel icon) se hota hai.
  const [isRingingMinimized, setIsRingingMinimized] = useState(false);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomName = call?.roomName;

  // FIX (banner ka look "professional" nahi lagta tha): plain static card
  // "live call" ka feel nahi deta - koi movement/pulse nahi tha jo bataye ke
  // call abhi bhi active/ringing hai. Ye do radar-ping rings avatar ke
  // gird ek ke baad ek (staggered) grow + fade karti hain - jaisa
  // WhatsApp/native OS "calling" indicators mein hota hai.
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRingingMinimized) return;
    const ring = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    const loop1 = ring(pulse1, 0);
    const loop2 = ring(pulse2, 800);
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
      pulse1.setValue(0);
      pulse2.setValue(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRingingMinimized]);

  const ringStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.55, 0.2, 0] }),
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) },
    ],
  });

  useEffect(() => {
    if (outgoingCall) {
      setCall(outgoingCall);
      setEndVariant(null);
      setIsRingingMinimized(false);
      cancelledRef.current = false;
    }
  }, [outgoingCall?.roomName]);

  // ─── Ringback / busy tone ───────────────────────────────────────────────
  // FIX: "Ringing..." ke doran normal ringback tone, aur "Busy" state ke
  // doran ek alag, fast beep-beep "busy tone" - jaisa real phone line-busy
  // signal hota hai. Teesra banda jab kisi ko call kare jo already busy hai,
  // usse sirf ek chup Toast nahi - ek asal busy-tone bhi sunayi deni chahiye.
  const soundRef = useRef<Audio.Sound | null>(null);
  const ringingActiveRef = useRef(true);

  const stopSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  };

  const playLoopingSound = async (asset: number) => {
    await stopSound();
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await Audio.Sound.createAsync(asset, { isLooping: true, volume: 1.0 });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (err) {
      console.log("[OutgoingCallOverlay] sound failed to load/play:", err);
    }
  };

  // Ringing shuru hote hi ringback tone.
  useEffect(() => {
    if (!roomName || endVariant) return;
    ringingActiveRef.current = true;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    playLoopingSound(require("../assets/sounds/ringback.mp3"));
    return () => {
      ringingActiveRef.current = false;
      stopSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  // Accept ho gaya - sound band karo AUR (FIX: pehle ye missing tha) us 45s
  // ring-timeout ko bhi cancel karo. Pehle sirf stopSound() hota tha - timer
  // background mein chalta rehta tha chahe call accept ho kar live ho chuki
  // ho. ~45s baad wo timer khud "no_answer" maan kar sendCancel("no_answer")
  // bhej deta tha aur "did not pick up" Toast dikhata tha - CHAHE call us
  // waqt genuinely connected/active thi. Ab accept hote hi cancelledRef true
  // ho jata hai aur pending timer clear ho jata hai, is liye late-firing
  // "no_answer" kabhi trigger nahi hoga jab call already answered ja chuki ho.
  useEffect(() => {
    if (activeRoomName === roomName) {
      stopSound();
      cancelledRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // FIX (purani "Ringing..." screen accept hone ke baad bhi dikhna):
      // clearOutgoingCall() sirf STORE ka outgoingCall null karta hai. Is
      // component ka apna local `call` snapshot (upar wale useEffect mein,
      // sirf outgoingCall TRUTHY hone par update hota hai) kabhi clear nahi
      // hota tha jab outgoingCall null ho - is liye `if (!call) return null`
      // kabhi trigger nahi hota tha aur ye poori "CALLING.../Ringing..."
      // screen CallOverlay.tsx ke connected-call bubble ke SAATH SAATH
      // dikhti rehti thi. Ab call genuinely connect hote hi (activeRoomName
      // match) hum khud apna state clear kar dete hain - CallOverlay ab is
      // call ko poori tarah handle karega.
      setCall(null);
      setIsRingingMinimized(false);
      setEndVariant(null);
    }
  }, [activeRoomName, roomName]);

  // Busy/declined/no_answer variant dikhte hi ringback rok kar, "busy" ke
  // liye alag tone + short vibration pattern chalao (asset optional -
  // vibration bina kisi file ke turant kaam karti hai).
  useEffect(() => {
    if (!endVariant) return;
    if (endVariant === "busy") {
      Vibration.vibrate([0, 150, 100, 150]);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      playLoopingSound(require("../assets/sounds/busy-tone.mp3"));
    } else {
      stopSound();
    }
    return () => {
      Vibration.cancel();
      stopSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endVariant]);
  // ──────────────────────────────────────────────────────────────────────

  const goBack = () => {
    setCall(null);
    setEndVariant(null);
    router.replace("/(tabs)/call/contacts");
  };

  const sendCancel = (reason: "cancelled" | "no_answer") => {
    if (cancelledRef.current || !call) return;
    cancelledRef.current = true;
    markSelfCancelled(call.roomName);
    clearOutgoingCall();
    post(
      "/api/call/reject",
      {
        targetXnid: call.calleeXnid,
        roomName: call.roomName,
        callerName: call.callerName,
        callerXnid: call.callerXnid,
        reason,
      },
      {},
      false,
    ).catch(() => {});
  };

  const handleCancel = () => {
    if (endVariant) {
      goBack();
      return;
    }
    sendCancel("cancelled");
    goBack();
  };

  // Dusre banday ne reject/busy/no-answer bheja.
  useEffect(() => {
    if (!callEndInfo || !roomName) return;
    if (callEndInfo.roomName !== roomName) return;

    cancelledRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const reason = callEndInfo.reason ?? "declined";
    const variant: CallingVariant =
      reason === "busy" ? "busy" : reason === "no_answer" ? "no_answer" : "declined";
    setEndVariant(variant);
    // Call resolve ho gayi - agar banner mein minimized thi, ab poora
    // outcome (busy/declined/no_answer) user ko clearly full-screen dikhao,
    // sirf silently minimized reh kar Toast se guzar mat jao.
    setIsRingingMinimized(false);
    setCallEndInfo(null);

    const t = setTimeout(() => {
      const isBusy = variant === "busy";
      const isNoAnswer = variant === "no_answer";
      const name = call?.calleeName ?? "They";
      // FIX (confusing mixed message): pehle "declined" ke liye text1 sahi
      // tha ("Call declined") lekin text2 galti se no_answer wala generic
      // "Your call was not answered." use kar raha tha - jabke on-screen
      // (CallingScreen.tsx) already sahi, DISTINCT text dikha chuki hoti
      // hai ("They declined your call"). Do jagah do alag messages dikhna
      // hi asal confusion tha. Ab Toast ka text har reason ke liye
      // on-screen text se exactly match/consistent hai - koi mix-up nahi.
      Toast.show({
        type: "info",
        text1: isBusy ? "User is busy" : isNoAnswer ? "No answer" : "Call declined",
        text2: isBusy
          ? `${name} is on another call right now.`
          : isNoAnswer
            ? `${name} did not pick up.`
            : `${name} declined your call.`,
      });
      goBack();
    }, END_STATE_DISPLAY_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callEndInfo, roomName]);

  // Ring timeout (naye call ke liye reset).
  useEffect(() => {
    if (!roomName) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      sendCancel("no_answer");
      setEndVariant("no_answer");
      setIsRingingMinimized(false);
      setTimeout(() => {
        Toast.show({
          type: "info",
          text1: "No answer",
          text2: `${call?.calleeName ?? "They"} did not pick up.`,
        });
        goBack();
      }, END_STATE_DISPLAY_MS);
    }, RING_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  // Back button: agar poori-screen ringing UI par ho, minimize kar do (jaisa
  // CallOverlay.tsx active call ke liye karta hai). Agar already minimized
  // ho, default back-navigation ko chalne do (return false) - call banner
  // mein chalti rehti hai, user app mein kahin bhi ghoom sakta hai. Agar
  // call resolve ho chuki hai (endVariant set), back ko ignore karo - ye
  // 1-2 second mein khud hi navigate/dismiss ho jayegi.
  useEffect(() => {
    if (!call) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (endVariant) return true;
      if (isRingingMinimized) return false;
      setIsRingingMinimized(true);
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, endVariant, isRingingMinimized]);

  if (!call) return null;

  // NEW (caller = moderator, stronger fix): "ringing" ke doran hi (accept
  // hone se PEHLE) is roomName ka page ek hidden, 1x1, FULLY MUTED WebView
  // mein load karna shuru kar dete hain. Camera/mic bilkul touch nahi karta
  // (config.startWithAudioMuted/VideoMuted=true) - is liye real call ki
  // camera se koi resource-conflict nahi. Fayda: jab genuinely accept ho
  // aur CallOverlay ka asal Screen2MeCall mount ho, uska page-load bohot
  // tez hota hai (DNS/TLS/JS-bundle already cached) - caller ka critical-
  // path latency drastically kam ho jata hai, is liye "pehle join = 
  // moderator" race mein caller ke jeetne ke odds bohot zyada ho jate hain.
  // Ye 100% guarantee nahi deta (bina backend JWT ke deterministic fix
  // possible nahi) lekin real-world network conditions mein bohot reliable
  // hai.
  const prewarmUrl = buildScreen2MeUrl(call.roomName, call.callerName, call.callerXnid, null, {
    forceMuted: true,
  });
  const prewarmView = (
    <View style={styles.prewarmHidden} pointerEvents="none">
      <WebView
        key={call.roomName}
        source={{ uri: prewarmUrl }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        onError={() => {}}
        onHttpError={() => {}}
      />
    </View>
  );

  if (isRingingMinimized) {
    return (
      <>
        {prewarmView}
        <Pressable
        onPress={() => setIsRingingMinimized(false)}
        style={[styles.banner, { paddingTop: insets.top + 10 }]}
      >
        <LinearGradient
          colors={["#111827", "#1B2436"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.bannerAccentLine} />

        <View style={styles.bannerContent}>
          <View style={styles.bannerAvatarWrap}>
            <Animated.View style={[styles.pulseRing, ringStyle(pulse1)]} />
            <Animated.View style={[styles.pulseRing, ringStyle(pulse2)]} />
            <View style={styles.bannerAvatar}>
              <Text style={styles.bannerAvatarText}>{getInitials(call.calleeName ?? "")}</Text>
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.bannerName} numberOfLines={1}>
              {call.calleeName || "Contact"}
            </Text>
            <View style={styles.bannerSubtitleRow}>
              <View style={styles.liveDot} />
              <Text style={styles.bannerSubtitle}>Ringing · Tap to return</Text>
            </View>
          </View>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.bannerCancelButton,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="call" size={17} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </Pressable>
        </View>
        </Pressable>
      </>
    );
  }

  return (
    <>
      {prewarmView}
      <View style={styles.overlay}>
        <CallingScreen
          calleeName={call.calleeName ?? "Contact"}
          onCancel={handleCancel}
          variant={endVariant ?? "calling"}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  prewarmHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    top: -1000,
    left: -1000,
    opacity: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
    elevation: 998,
  },
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 998,
    elevation: 998,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  bannerAccentLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: Colors.PRIMARY,
    opacity: 0.9,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerAvatarWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.PRIMARY,
  },
  bannerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  bannerAvatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  bannerName: { color: "#fff", fontWeight: "700", fontSize: 14.5, letterSpacing: 0.2 },
  bannerSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
    marginRight: 6,
  },
  bannerSubtitle: { color: "#9CA3AF", fontSize: 12 },
  bannerCancelButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    shadowColor: "#E53935",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});