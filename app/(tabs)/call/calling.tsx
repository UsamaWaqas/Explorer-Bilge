import { useRouter } from "expo-router";
import { useEffect } from "react";

// FIX (full-screen bug): ye poori screen ab components/OutgoingCallOverlay.tsx
// mein move ho chuki hai, jo (tabs)/_layout.tsx mein <Tabs> ke BAHAR mounted
// hai - taake app ka persistent Header cover ho sake aur navigation se kabhi
// unmount na ho. Ye route file ab sirf ek safety-net bridge hai: agar kahin
// (purana deep link, cached notification payload, waghera) is route ko
// direct hit kare, hum bas contacts par bounce kar dete hain instead of
// stale/duplicate UI dikhane ke - asal call state (agar koi ho) already
// store/callStore.ts ke outgoingCall mein hai, jise OutgoingCallOverlay khud
// hi automatically render kar deta hai.
export default function CallingRouteScreenDeprecated() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(tabs)/call/contacts");
  }, []);

  return null;
}