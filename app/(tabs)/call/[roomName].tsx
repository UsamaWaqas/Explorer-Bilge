import { Camera } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { post } from '../../../api/apiHelper';
import { Screen2MeCall } from '../../../components/Screen2MeCall';
import { useCallStore } from '../../../store/callStore';
import { getMsSinceLastCallEnded, markCallEnded } from '../../../utils/Calltiming';

// Minimum gap (ms) we want between the previous call's WebView unmounting
// and the next one mounting, so Android's camera service has time to
// actually release the hardware before the next getUserMedia() request.
const CAMERA_RELEASE_BUFFER_MS = 1200;

export default function CallScreen() {
  const { roomName: rawRoomName, displayName, xnid, calleeXnid } = useLocalSearchParams<{
    roomName: string;
    displayName: string;
    xnid: string;
    calleeXnid?: string;
  }>();

  // FIX: decodeURIComponent can throw on a malformed sequence. Whichever
  // side navigated here (caller via calling.tsx/acceptedCallback, or
  // receiver via IncomingCallModal) now always passes a raw, unencoded
  // roomName, so this is normally a no-op — but we still guard it so a
  // stray "%" in a room name can never crash this screen.
  const roomName = (() => {
    if (!rawRoomName) return rawRoomName;
    try {
      return decodeURIComponent(rawRoomName);
    } catch {
      return rawRoomName;
    }
  })();

  const router = useRouter();
  const [permissionsReady, setPermissionsReady] = useState(false);
  // FIX: distinguishes "still asking" from "user said no" — the retry/
  // Settings UI below only appears once we know permission was actually
  // denied, not while the OS prompt is still pending.
  const [permissionDenied, setPermissionDenied] = useState(false);
  // Jab call genuinely khatam ho rahi ho (graceful transition ke liye)
  const [ending, setEnding] = useState(false);
  // True jab tak camera-release buffer poora na ho jaye - tab tak WebView
  // mount nahi karte
  const [cameraReady, setCameraReady] = useState(false);
  // Double-trigger se bachne ke liye (e.g. back button + webview dono ek sath)
  const hangupTriggeredRef = useRef(false);
  // FIX: track karta hai ke call genuinely connect (answer) ho chuki thi ya
  // nahi. Agar caller answer hone se PEHLE hi cut kare, to receiver ko
  // /api/call/reject se inform karna hai (taake unka incoming-call modal
  // khud-ba-khud band ho jaye) - lekin agar call already answered/connected
  // thi to ye API mat bhejna (warna completed call galti se "rejected"
  // log ho jayegi).
  const answeredRef = useRef(false);

  const setActiveRoomName = useCallStore((s) => s.setActiveRoomName);
  const setCallAccepted = useCallStore((s) => s.setCallAccepted);

  const requestPermissions = async () => {
    setPermissionDenied(false);
    const cam = await Camera.requestCameraPermissionsAsync();
    const mic = await Camera.requestMicrophonePermissionsAsync();
    const granted = cam.status === 'granted' && mic.status === 'granted';
    setPermissionsReady(granted);
    if (!granted) setPermissionDenied(true);
  };

  useEffect(() => {
    requestPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIX: agar Expo Router kabhi isi screen instance ko reuse kare (sirf
  // params badlein, naya mount na ho) to purani call ka stale state
  // (ending=true, hangupTriggeredRef=true) naye call par bhi reh jata tha.
  // Defensive reset - har roomName change par fresh state.
  useEffect(() => {
    setEnding(false);
    hangupTriggeredRef.current = false;
    answeredRef.current = false;
  }, [roomName]);

  // FIX (busy tracking): is screen ke mount/roomName change hote hi user ko
  // "active call" mark karo, taake koi naya incoming call is ongoing call ko
  // beech mein disturb na kare (3rd banda call kare to usko busy mile,
  // current call untouched rahe). Screen unmount ya call khatam hone par
  // clear kar dete hain.
  useEffect(() => {
    if (roomName) {
      setActiveRoomName(roomName);
      setCallAccepted(true);
    }
    return () => {
      const current = useCallStore.getState().activeRoomName;
      if (current === roomName) {
        setActiveRoomName(null);
        setCallAccepted(false);
      }
    };
  }, [roomName]);

  // FIX (root cause): naya WebView turant mount hone se pichli call ka camera
  // abhi tak release nahi hua hota (Android native-level delay), is wajah se
  // dusri call hamesha "Connecting call..." par atki reh jati thi - kabhi
  // connect hi nahi hoti thi. Ab mount se pehle ek chhota buffer wait karte
  // hain, sirf agar previous call recently khatam hui ho.
  useEffect(() => {
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

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Agar stack mein koi screen nahi to contacts par wapas jao
      router.replace('/(tabs)/call/contacts');
    }
  };

  const handleHangUp = () => {
    if (hangupTriggeredRef.current) return;
    hangupTriggeredRef.current = true;

    // Agle call ke camera-release buffer ke liye timestamp record karo
    markCallEnded();

    // Busy state clear karo - user ab free hai
    setActiveRoomName(null);
    setCallAccepted(false);

    // FIX: dono taraf se — caller ya receiver, jo bhi is screen se pehle
    // hangup kare — dusre banda ko notify karo agar call abhi answer
    // (genuinely connect) nahi hui thi. calleeXnid ab caller aur receiver
    // dono ke navigation params mein consistently pass hota hai
    // (contacts.tsx -> calling.tsx path, aur IncomingCallModal.tsx path).
    if (!answeredRef.current && calleeXnid) {
      post(
        '/api/call/reject',
        {
          targetXnid: calleeXnid,
          roomName,
          callerName: displayName,
          callerXnid: xnid,
        },
        {},
        false,
      ).catch(() => {});
    }

    // Chhota "Ending call..." overlay dikhao phir smoothly navigate karo -
    // professional transition, abrupt cut nahi.
    setEnding(true);

    let navigated = false;
    const doNavigate = () => {
      if (navigated) return;
      navigated = true;
      goBack();
    };

    setTimeout(doNavigate, 500);
    // Hard fallback: agar kisi wajah se upar wala timeout/navigation
    // silently fail ho jaye, screen kabhi permanently "Ending call..." par
    // atki na rahe.
    setTimeout(doNavigate, 2500);
  };

  useEffect(() => {
    // Android hardware Back button explicitly handle karo - same graceful
    // hangup flow jo in-app "Leave"/"End call" button use karta hai.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleHangUp();
      return true; // default back-pop ko roko, hum khud navigate karenge
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (permissionDenied) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 20, paddingHorizontal: 24 }}>
          Camera and microphone access is required for calls. Please enable
          them for this app.
        </Text>
        {/* FIX: previously a permanently-denied permission left the user on
            an unlabeled spinner forever with no way out except the Android
            hardware back button. Now they get an explicit message plus a
            direct link to the OS settings screen, and a way to retry or
            leave. */}
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
        <Pressable style={[styles.retryButton, { backgroundColor: '#374151', marginTop: 12 }]} onPress={requestPermissions}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
        <Pressable style={{ marginTop: 20 }} onPress={goBack}>
          <Text style={{ color: '#9CA3AF' }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (!permissionsReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 16 }}>
         The app is requesting access to your camera and microphone
        </Text>
      </View>
    );
  }

  if (ending) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 16 }}>
          Ending call...
        </Text>
      </View>
    );
  }

  if (!cameraReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 16 }}>
          Preparing call...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Screen2MeCall
        roomName={roomName}
        displayName={displayName ?? 'User'}
        xnid={xnid ?? ''}
        token={null}
        onHangUp={handleHangUp}
        onConnected={() => {
          answeredRef.current = true;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  retryButton: {
    backgroundColor: '#2C64B3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});