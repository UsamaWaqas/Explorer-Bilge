import { Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { post } from '../api/apiHelper';
import { Colors } from '../assets/Color';
import { useCallStore } from '../store/callStore';
import { getMsSinceLastCallEnded, markCallEnded } from '../utils/Calltiming';
import { Screen2MeCall } from './Screen2MeCall';

const CAMERA_RELEASE_BUFFER_MS = 1200;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BUBBLE_SIZE = 64;
const BUBBLE_MARGIN = 12;
const BUBBLE_TOP_BOUND = 60;
const BUBBLE_BOTTOM_BOUND = SCREEN_H - 140;

function getInitials(name: string) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// FIX (root cause of "receiver sees left" bug): pehle jab isCallMinimized
// true hota tha, ye component sirf bubble return karta tha - Screen2MeCall
// (WebView) render tree mein hi nahi hota tha, matlab WebView UNMOUNT ho
// jati thi. WebView unmount = Jitsi room genuinely chhod dena, jis se
// doosri taraf 'participantLeft' fire hota tha aur wo apni call turant
// khatam kar deta tha ("left" dikhta tha) - chahe ye taraf sirf minimize
// hui thi, call end nahi ki thi.
//
// Ab dono states (fullscreen + bubble) EK HI return mein saath render hote
// hain. Screen2MeCall hamesha mounted rehta hai jab tak activeCall khatam
// na ho (handleHangUp). Minimize sirf visual hai - opacity 0 + pointerEvents
// 'none' se hide karte hain, unmount nahi karte. Bubble sirf upar overlay
// ki tarah dikhti hai.
export default function CallOverlay() {
  const router = useRouter();
  const activeCall = useCallStore((s) => s.activeCall);
  const isCallMinimized = useCallStore((s) => s.isCallMinimized);
  const setCallMinimized = useCallStore((s) => s.setCallMinimized);
  const clearActiveCall = useCallStore((s) => s.clearActiveCall);

  const [permissionsReady, setPermissionsReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [ending, setEnding] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const hangupTriggeredRef = useRef(false);
  const answeredRef = useRef(false);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const roomName = activeCall?.roomName;

  const requestPermissions = async () => {
    setPermissionDenied(false);
    const cam = await Camera.requestCameraPermissionsAsync();
    const mic = await Camera.requestMicrophonePermissionsAsync();
    const granted = cam.status === 'granted' && mic.status === 'granted';
    setPermissionsReady(granted);
    if (!granted) setPermissionDenied(true);
  };

  useEffect(() => {
    if (!activeCall) return;
    setPermissionsReady(false);
    setPermissionDenied(false);
    requestPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall !== null]);

  useEffect(() => {
    if (!roomName) return;
    setEnding(false);
    hangupTriggeredRef.current = false;
    answeredRef.current = false;
    setElapsedSec(0);
    setCallConnected(false);
  }, [roomName]);

  useEffect(() => {
    if (!roomName) return;
    setCameraReady(false);
    const elapsed = getMsSinceLastCallEnded();
    if (elapsed >= CAMERA_RELEASE_BUFFER_MS) {
      setCameraReady(true);
      return;
    }
    const wait = CAMERA_RELEASE_BUFFER_MS - elapsed;
    const t = setTimeout(() => setCameraReady(true), wait);
    return () => clearTimeout(t);
  }, [roomName]);

  // FIX (call-duration timer thoda inflated tha): pehle ye interval
  // activeCall mount hote hi shuru ho jata tha - matlab permission-request,
  // camera-ready buffer, aur (ab naye moderator-fix se) callee ke
  // intentional joinDelayMs ke doran bhi count ho raha hota tha, chahe call
  // abhi genuinely connect na hui ho. Ab sirf `answeredRef.current` true
  // hone (VIDEO_CONNECTED) ke baad hi shuru hota hai - bubble/timer par
  // dikhne wala duration ab actual connected time se match karta hai.
  const [callConnected, setCallConnected] = useState(false);

  useEffect(() => {
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    if (!activeCall || !callConnected) return;
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, [activeCall !== null, callConnected]);

  const goToContacts = () => {
    router.replace('/(tabs)/call/contacts');
  };

  const handleHangUp = () => {
    if (hangupTriggeredRef.current) return;
    hangupTriggeredRef.current = true;

    markCallEnded();
    clearActiveCall();

    if (!answeredRef.current && activeCall?.calleeXnid) {
      post(
        '/api/call/reject',
        {
          targetXnid: activeCall.calleeXnid,
          roomName: activeCall.roomName,
          callerName: activeCall.displayName,
          callerXnid: activeCall.xnid,
        },
        {},
        false,
      ).catch(() => {});
    }

    setEnding(true);

    let navigated = false;
    const doNavigate = () => {
      if (navigated) return;
      navigated = true;
      goToContacts();
    };

    setTimeout(doNavigate, 500);
    setTimeout(doNavigate, 2500);
  };

  useEffect(() => {
    if (!activeCall) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isCallMinimized) return false;
      if (hangupTriggeredRef.current || ending) return true;
      setCallMinimized(true);
      return true;
    });
    return () => subscription.remove();
  }, [activeCall !== null, isCallMinimized, ending]);

  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_W - BUBBLE_SIZE - BUBBLE_MARGIN,
      y: BUBBLE_TOP_BOUND + 40,
    }),
  ).current;
  const dragStartedRef = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        dragStartedRef.current = false;
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_e, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
          dragStartedRef.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(
          _e,
          gesture,
        );
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const wasDrag = dragStartedRef.current;

        if (!wasDrag) {
          setCallMinimized(false);
          return;
        }

        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        const snapX =
          currentX + BUBBLE_SIZE / 2 < SCREEN_W / 2
            ? BUBBLE_MARGIN
            : SCREEN_W - BUBBLE_SIZE - BUBBLE_MARGIN;
        const clampedY = Math.min(
          Math.max(currentY, BUBBLE_TOP_BOUND),
          BUBBLE_BOTTOM_BOUND,
        );

        Animated.spring(pan, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    }),
  ).current;

  if (!activeCall) return null;

  return (
    <>
      {/* Full call surface - hamesha mounted (jab tak activeCall hai), sirf
          visually chhupti hai minimize ke doran. Isi wajah se WebView/Jitsi
          connection kabhi break nahi hoti minimize par. */}
      <View
        pointerEvents={isCallMinimized ? 'none' : 'auto'}
        style={[styles.fullScreen, isCallMinimized && styles.hiddenWhileMinimized]}
      >
        {permissionDenied ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingLabel}>
              Camera and microphone access is required for calls. Please enable
              them for this app.
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
            >
              <Text style={styles.retryButtonText}>Open Settings</Text>
            </Pressable>
            <Pressable
              style={[styles.retryButton, { backgroundColor: '#374151', marginTop: 12 }]}
              onPress={requestPermissions}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
            <Pressable style={{ marginTop: 20 }} onPress={handleHangUp}>
              <Text style={{ color: '#9CA3AF' }}>Cancel</Text>
            </Pressable>
          </View>
        ) : !permissionsReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingLabel}>
              The app is requesting access to your camera and microphone
            </Text>
          </View>
        ) : ending ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingLabel}>Ending call...</Text>
          </View>
        ) : !cameraReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingLabel}>Preparing call...</Text>
          </View>
        ) : (
          <>
            <Screen2MeCall
              roomName={activeCall.roomName}
              displayName={activeCall.displayName}
              xnid={activeCall.xnid}
              token={null}
              onHangUp={handleHangUp}
              onConnected={() => {
                answeredRef.current = true;
                setCallConnected(true);
              }}
              // NEW (caller = moderator): callee ko jaan-boojh kar chhota
              // buffer diya jata hai taake caller (jo network round-trip
              // ka wait kar raha tha) hamesha pehle Jitsi room join kare -
              // is se caller consistently moderator banta hai. activeCall.isCaller
              // undefined honay par (purani/edge case) safe default: delay mat do.
              joinDelayMs={activeCall.isCaller === false ? 900 : 0}
            />
            <Pressable
              style={styles.minimizeButton}
              onPress={() => setCallMinimized(true)}
              hitSlop={10}
            >
              <Ionicons name="chevron-down" size={22} color="#fff" />
            </Pressable>
          </>
        )}
      </View>

      {/* Bubble - sirf minimized hone par upar overlay ki tarah dikhti hai */}
      {isCallMinimized && (
        <Animated.View
          style={[styles.bubble, { transform: pan.getTranslateTransform() }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.bubbleAvatar}>
            <Text style={styles.bubbleAvatarText}>
              {getInitials(activeCall.calleeName ?? activeCall.displayName)}
            </Text>
          </View>
          <View style={styles.bubbleLiveDot} />
          <Text style={styles.bubbleTimer}>{formatDuration(elapsedSec)}</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
    elevation: 999,
  },
  hiddenWhileMinimized: {
    opacity: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingLabel: { color: '#fff', textAlign: 'center', marginTop: 16 },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2C64B3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  minimizeButton: {
    position: 'absolute',
    top: 46,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  bubble: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  bubbleAvatar: {
    width: BUBBLE_SIZE - 6,
    height: BUBBLE_SIZE - 6,
    borderRadius: (BUBBLE_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleAvatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  bubbleLiveDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  bubbleTimer: {
    position: 'absolute',
    bottom: -18,
    color: '#111827',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
});