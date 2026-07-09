// import { Camera } from 'expo-camera';
// import { useRouter } from 'expo-router';
// import { useEffect, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Animated,
//   BackHandler,
//   Dimensions,
//   PanResponder,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { post } from '../api/apiHelper';
// import { Colors } from '../assets/Color';
// import { useCallStore } from '../store/callStore';
// import { getMsSinceLastCallEnded, markCallEnded } from '../utils/Calltiming';
// import { Screen2MeCall } from './Screen2MeCall';

// // Minimum gap (ms) we want between the previous call's WebView unmounting
// // and the next one mounting, so Android's camera service has time to
// // actually release the hardware before the next getUserMedia() request.
// const CAMERA_RELEASE_BUFFER_MS = 1200;

// const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// const BUBBLE_SIZE = 64;
// const BUBBLE_MARGIN = 12;
// // Keep the bubble clear of the status bar and the bottom tab bar.
// const BUBBLE_TOP_BOUND = 60;
// const BUBBLE_BOTTOM_BOUND = SCREEN_H - 140;

// function getInitials(name: string) {
//   const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
//   if (parts.length === 0) return '?';
//   if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
//   return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
// }

// function formatDuration(sec: number) {
//   const m = Math.floor(sec / 60).toString().padStart(2, '0');
//   const s = Math.floor(sec % 60).toString().padStart(2, '0');
//   return `${m}:${s}`;
// }

// // FIX (persistent call / professional minimize behavior): pehle call ka
// // poora UI aur lifecycle app/(tabs)/call/[roomName].tsx route ke andar tha —
// // jaisi hi user kahin aur navigate karta (sidebar, back button, dusra tab),
// // Expo Router us screen ko unmount kar deta tha, WebView/camera cut ho jati,
// // aur call effectively mar jati thi. Ab poori call ka UI + lifecycle yahan,
// // CallOverlay mein hai, jo (tabs)/_layout.tsx mein Tabs ke bahar mount hota
// // hai — is liye ye kabhi route navigation se unmount nahi hota. Store ka
// // `activeCall` hi single source of truth hai; route [roomName].tsx sirf ek
// // chhota "bridge" hai jo params ko store mein daal deta hai.
// //
// // Minimize/restore ke doran WebView kabhi bhi unmount NAHI hoti (sirf
// // opacity/pointerEvents/zIndex se hide hoti hai) — is liye camera/mic stream
// // zinda rehti hai aur restore par koi reconnect/loading nahi hota.
// export default function CallOverlay() {
//   const router = useRouter();
//   const activeCall = useCallStore((s) => s.activeCall);
//   const isCallMinimized = useCallStore((s) => s.isCallMinimized);
//   const setCallMinimized = useCallStore((s) => s.setCallMinimized);
//   const clearActiveCall = useCallStore((s) => s.clearActiveCall);

//   const [permissionsReady, setPermissionsReady] = useState(false);
//   // Jab call genuinely khatam ho rahi ho (graceful transition ke liye)
//   const [ending, setEnding] = useState(false);
//   // True jab tak camera-release buffer poora na ho jaye - tab tak WebView
//   // mount nahi karte
//   const [cameraReady, setCameraReady] = useState(false);
//   const [elapsedSec, setElapsedSec] = useState(0);

//   // Double-trigger se bachne ke liye (e.g. back button + webview dono ek sath)
//   const hangupTriggeredRef = useRef(false);
//   // FIX: track karta hai ke call genuinely connect (answer) ho chuki thi ya
//   // nahi — early-cancel /api/call/reject sirf tab bhejna hai jab caller ne
//   // answer se PEHLE hi cut ki ho.
//   const answeredRef = useRef(false);
//   const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   const roomName = activeCall?.roomName;

//   // ── Camera/mic permissions ────────────────────────────────────────────
//   useEffect(() => {
//     if (!activeCall) return;
//     (async () => {
//       const cam = await Camera.requestCameraPermissionsAsync();
//       const mic = await Camera.requestMicrophonePermissionsAsync();
//       setPermissionsReady(cam.status === 'granted' && mic.status === 'granted');
//     })();
//   }, [activeCall !== null]);

//   // ── Fresh state whenever a genuinely new call starts ────────────────────
//   useEffect(() => {
//     if (!roomName) return;
//     setEnding(false);
//     hangupTriggeredRef.current = false;
//     answeredRef.current = false;
//     setElapsedSec(0);
//   }, [roomName]);

//   // ── Camera-release buffer before mounting the WebView ──────────────────
//   useEffect(() => {
//     if (!roomName) return;
//     setCameraReady(false);
//     const elapsed = getMsSinceLastCallEnded();
//     if (elapsed >= CAMERA_RELEASE_BUFFER_MS) {
//       setCameraReady(true);
//       return;
//     }
//     const wait = CAMERA_RELEASE_BUFFER_MS - elapsed;
//     const t = setTimeout(() => setCameraReady(true), wait);
//     return () => clearTimeout(t);
//   }, [roomName]);

//   // ── Call duration timer (shown on the minimized bubble) ────────────────
//   useEffect(() => {
//     if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
//     if (!activeCall) return;
//     elapsedIntervalRef.current = setInterval(() => {
//       setElapsedSec((s) => s + 1);
//     }, 1000);
//     return () => {
//       if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
//     };
//   }, [activeCall !== null]);

//   const goToContacts = () => {
//     router.replace('/(tabs)/call/contacts');
//   };

//   const handleHangUp = () => {
//     if (hangupTriggeredRef.current) return;
//     hangupTriggeredRef.current = true;

//     markCallEnded();

//     // FIX: receiver ko notify karo agar humne (caller ne) call answer hone
//     // se PEHLE hi cut kar di - warna unka incoming-call modal hamesha dikhta
//     // reh jata hai.
//     if (!answeredRef.current && activeCall?.calleeXnid) {
//       post(
//         '/api/call/reject',
//         {
//           targetXnid: activeCall.calleeXnid,
//           roomName: activeCall.roomName,
//           callerName: activeCall.displayName,
//           callerXnid: activeCall.xnid,
//         },
//         {},
//         false,
//       ).catch(() => {});
//     }

//     setEnding(true);

//     let navigated = false;
//     const doNavigate = () => {
//       if (navigated) return;
//       navigated = true;
//       clearActiveCall();
//       goToContacts();
//     };

//     setTimeout(doNavigate, 500);
//     // Hard fallback: agar kisi wajah se upar wala timeout/navigation
//     // silently fail ho jaye, call kabhi permanently "Ending call..." par
//     // atki na rahe.
//     setTimeout(doNavigate, 2500);
//   };

//   // FIX (professional call UX): hardware back button ab call ko turant
//   // hangup nahi karta. Zoom/Meet/WhatsApp jaisi apps back button par call
//   // ko minimize kar deti hain (floating bubble), end nahi karti — end karne
//   // ka explicit tareeqa hamesha call UI ke andar (Jitsi hangup button)
//   // maujood rehta hai. Sirf tab active hota hai jab call full-screen ho aur
//   // koi transition already na chal rahi ho.
//   useEffect(() => {
//     if (!activeCall) return;
//     const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
//       if (isCallMinimized) return false; // let normal navigation happen
//       if (hangupTriggeredRef.current || ending) return true;
//       setCallMinimized(true);
//       return true;
//     });
//     return () => subscription.remove();
//   }, [activeCall !== null, isCallMinimized, ending]);

//   // ── Draggable bubble position (Animated.ValueXY + PanResponder) ────────
//   const pan = useRef(
//     new Animated.ValueXY({
//       x: SCREEN_W - BUBBLE_SIZE - BUBBLE_MARGIN,
//       y: BUBBLE_TOP_BOUND + 40,
//     }),
//   ).current;
//   const dragStartedRef = useRef(false);
//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponder: (_e, gesture) =>
//         Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
//       onPanResponderGrant: () => {
//         dragStartedRef.current = false;
//         pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
//         pan.setValue({ x: 0, y: 0 });
//       },
//       onPanResponderMove: (_e, gesture) => {
//         if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
//           dragStartedRef.current = true;
//         }
//         Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(
//           _e,
//           gesture,
//         );
//       },
//       onPanResponderRelease: (_e, gesture) => {
//         pan.flattenOffset();
//         const wasDrag = dragStartedRef.current;

//         if (!wasDrag) {
//           // Treat as a tap — restore full-screen call.
//           setCallMinimized(false);
//           return;
//         }

//         // Snap to nearest horizontal edge, clamp vertical bounds.
//         const currentX = (pan.x as any)._value;
//         const currentY = (pan.y as any)._value;
//         const snapX =
//           currentX + BUBBLE_SIZE / 2 < SCREEN_W / 2
//             ? BUBBLE_MARGIN
//             : SCREEN_W - BUBBLE_SIZE - BUBBLE_MARGIN;
//         const clampedY = Math.min(
//           Math.max(currentY, BUBBLE_TOP_BOUND),
//           BUBBLE_BOTTOM_BOUND,
//         );

//         Animated.spring(pan, {
//           toValue: { x: snapX, y: clampedY },
//           useNativeDriver: false,
//           friction: 7,
//         }).start();
//       },
//     }),
//   ).current;

//   if (!activeCall) return null;

//   // ── Minimized: floating draggable bubble ────────────────────────────────
//   // NOTE: deliberately no mini hangup button on the bubble itself — a
//   // Pressable nested inside a PanResponder-owning view doesn't reliably
//   // receive taps (the drag responder claims the touch first), so a
//   // "hangup" icon here would intermittently just restore the call instead.
//   // Tap the bubble to restore full-screen, then use the call's own hangup
//   // control — that's a touch target that's always reliable.
//   if (isCallMinimized) {
//     return (
//       <Animated.View
//         style={[styles.bubble, { transform: pan.getTranslateTransform() }]}
//         {...panResponder.panHandlers}
//       >
//         <View style={styles.bubbleAvatar}>
//           <Text style={styles.bubbleAvatarText}>
//             {getInitials(activeCall.calleeName ?? activeCall.displayName)}
//           </Text>
//         </View>
//         <View style={styles.bubbleLiveDot} />
//         <Text style={styles.bubbleTimer}>{formatDuration(elapsedSec)}</Text>
//       </Animated.View>
//     );
//   }

//   // ── Full-screen: the actual call ────────────────────────────────────────
//   return (
//     <View style={styles.fullScreen}>
//       {!permissionsReady ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#ffffff" />
//           <Text style={styles.loadingLabel}>
//             The app is requesting access to your camera and microphone
//           </Text>
//         </View>
//       ) : ending ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#ffffff" />
//           <Text style={styles.loadingLabel}>Ending call...</Text>
//         </View>
//       ) : !cameraReady ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#ffffff" />
//           <Text style={styles.loadingLabel}>Preparing call...</Text>
//         </View>
//       ) : (
//         <>
//           <Screen2MeCall
//             roomName={activeCall.roomName}
//             displayName={activeCall.displayName}
//             xnid={activeCall.xnid}
//             token={null}
//             onHangUp={handleHangUp}
//             onConnected={() => {
//               answeredRef.current = true;
//             }}
//           />
//           {/* Minimize control — sits above the WebView toolbar */}
//           <Pressable
//             style={styles.minimizeButton}
//             onPress={() => setCallMinimized(true)}
//             hitSlop={10}
//           >
//             <Ionicons name="chevron-down" size={22} color="#fff" />
//           </Pressable>
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   fullScreen: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: '#000',
//     zIndex: 999,
//     elevation: 999,
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   loadingLabel: { color: '#fff', textAlign: 'center', marginTop: 16 },
//   minimizeButton: {
//     position: 'absolute',
//     top: 46,
//     left: 16,
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 1000,
//   },
//   bubble: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: BUBBLE_SIZE,
//     height: BUBBLE_SIZE,
//     borderRadius: BUBBLE_SIZE / 2,
//     backgroundColor: Colors.PRIMARY,
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 1000,
//     elevation: 12,
//     shadowColor: '#000',
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//   },
//   bubbleAvatar: {
//     width: BUBBLE_SIZE - 6,
//     height: BUBBLE_SIZE - 6,
//     borderRadius: (BUBBLE_SIZE - 6) / 2,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   bubbleAvatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
//   bubbleLiveDot: {
//     position: 'absolute',
//     top: 2,
//     right: 2,
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#22C55E',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   bubbleTimer: {
//     position: 'absolute',
//     bottom: -18,
//     color: '#111827',
//     fontSize: 11,
//     fontWeight: '600',
//     backgroundColor: '#fff',
//     paddingHorizontal: 6,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
// });