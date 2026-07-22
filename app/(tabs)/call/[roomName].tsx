import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useCallStore } from '../../../store/callStore';

// FIX (call cut on navigation / back button): pehle poora call ka UI
// (permissions, WebView, hangup logic) isi route ke andar tha. Expo Router
// jaise hi user kahin aur navigate karta (sidebar, doosra tab, back button),
// ye screen unmount ho jati thi aur WebView/camera ke sath call bhi cut ho
// jati thi. Ab poori call CallOverlay.tsx mein hoti hai, jo
// (tabs)/_layout.tsx mein <Tabs> ke BAHAR mounted hai - is liye kabhi
// navigation se unmount nahi hoti. Ye route ab sirf ek chhota "bridge" hai:
// params ko store mein daal do, aur turant ek normal tab pe bounce ho jao -
// CallOverlay khud hi full-screen render ho kar upar aa jayega.
export default function CallRouteScreen() {
  const router = useRouter();
  const { roomName: rawRoomName, displayName, xnid, calleeXnid, calleeName, isCaller } =
    useLocalSearchParams<{
      roomName: string;
      displayName: string;
      xnid: string;
      calleeXnid?: string;
      calleeName?: string;
      isCaller?: string;
    }>();
  const setActiveCall = useCallStore((s) => s.setActiveCall);

  useEffect(() => {
    if (!rawRoomName) return;

    let roomName = rawRoomName;
    try {
      roomName = decodeURIComponent(rawRoomName);
    } catch {
      // malformed sequence - raw value hi use karo
    }

    setActiveCall({
      roomName,
      displayName: displayName ?? 'User',
      xnid: xnid ?? '',
      calleeXnid,
      calleeName,
      isCaller: isCaller === '1',
    });

    router.replace('/(tabs)/call/contacts');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRoomName]);

  return null;
}