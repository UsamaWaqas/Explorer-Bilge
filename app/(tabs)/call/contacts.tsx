import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { get, post } from "../../../api/apiHelper";
import { Colors } from "../../../assets/Color";
import { useAuthStore } from "../../../store/authStore";
import { useCallStore } from "../../../store/callStore";
// FIX (static room reuse / zombie session): buildPrivateRoom() alone gives
// the same room name every time these two people call each other. We now
// use buildNewCallRoom(), which appends a fresh session id, so every call
// gets its own Jitsi room and can't collide with a leftover session.
import { buildNewCallRoom } from "../../../utils/roomBuilder";

interface Customer {
  id: number;
  xnid: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
}

// FIX (PII logging): all the verbose debug logging that used to run
// unconditionally (even in release builds) now goes through devLog, which
// is a no-op outside __DEV__. This keeps emails/room names/channel names
// out of production device logs.
function devLog(...args: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

function getInitials(name: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CallContactsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const myXnid = user?.xnid;
  const setOutgoingCall = useCallStore((s) => s.setOutgoingCall);

  // FIX (issue 2 — minimized call bubble + Contacts): pehle is screen ko
  // bilkul pata hi nahi hota tha ke koi call already chal rahi hai (chahe
  // full-screen ho ya minimized bubble). Is wajah se user Support → Contacts
  // jaisi navigation ke baad bhi "Call" button dabata reh sakta tha, jo ek
  // dusra /api/call/invite fire kar deta - ongoing call ke sath conflict.
  // Ab activeCall ko yahan bhi read karte hain: jab tak koi call chal rahi
  // hai, poori list disabled rehti hai aur upar ek banner dikhta hai jisse
  // seedha wapas call par ja sakte hain (WhatsApp/Zoom jaisa behavior).
  const activeCall = useCallStore((s) => s.activeCall);
  const setCallMinimized = useCallStore((s) => s.setCallMinimized);
  const isOnCall = !!activeCall;

  devLog("[Contacts] SCREEN MOUNTED, user.xnid:", myXnid, "user.email:", user?.email);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [callingId, setCallingId] = useState<number | null>(null);
  // FIX (double-tap): setCallingId(...) is async, so a fast double-tap could
  // fire two invites before the state re-render disables the button. This
  // ref flips synchronously on the very first tap.
  const callInFlightRef = useRef(false);

  async function fetchCustomers(query = "") {
    setLoading(true);
    const res = await get("/api/customers/list", {
      limit: 50,
      offset: 0,
      search: query,
      title: "",
    });

    if (!res?.error && res?.success) {
      const list: Customer[] = res?.data?.data ?? [];
      const filtered = list.filter((c) => c.xnid !== myXnid);
      setCustomers(filtered);
    } else {
      devLog("[Contacts] fetchCustomers failed or returned error:", res);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  function getDisplayName() {
    return `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User";
  }

  async function handleCall(customer: Customer) {
    // FIX (issue 2): agar ek call already active hai (full-screen ya
    // minimized), naya invite bilkul shuru mat karo - user ko clearly
    // batao aur unhe wapas apni chalti hui call par bhej do, taake wo
    // confuse na hon ke unka tap kaam kyun nahi kar raha.
    if (isOnCall) {
      Toast.show({
        type: "info",
        text1: "You're already on a call",
        text2: "Finish or return to your current call first.",
      });
      return;
    }

    if (callInFlightRef.current) return;
    callInFlightRef.current = true;
    setCallingId(customer.id);

    // FIX: fresh room name every call instead of the static
    // buildPrivateRoom() pair-room, so a previous (possibly not-fully-closed)
    // Jitsi session can never collide with this new call.
    const roomName = buildNewCallRoom(String(user?.email), String(customer.email));

    // NOTE: ye same format hai jo getCallChannelName() (constants/pusher.ts)
    // actually subscribe karta hai — public channel, koi "private-" prefix
    // ya md5 hashing nahi. Pehle ye debug line galat "private-user.<md5>"
    // dikhati thi jo asal subscribed channel se match nahi karti thi.
    const receiverChannel = `user.${String(customer.email)}`;
    devLog(
      "[Contacts] Expecting backend to fire 'incoming.call' on channel:",
      receiverChannel,
      "roomName:",
      roomName,
    );

    try {
      const invitePayload = {
        targetXnid: customer.email,
        roomName,
        callerName: getDisplayName(),
        callerXnid: user?.email,
      };

      const inviteRes = await post("/api/call/invite", invitePayload, {}, false);

      if (!inviteRes || inviteRes?.error) {
        // FIX (silent-fail invite): previously the screen navigated into
        // the call room regardless of whether the invite actually reached
        // the backend. Now, if the invite fails, we tell the caller and
        // stop here — we never enter a room the other person was never
        // notified about.
        devLog("[Contacts] /api/call/invite FAILED:", inviteRes);
        Toast.show({
          type: "error",
          text1: "Couldn't start the call",
          text2: inviteRes?.message || "Please check your connection and try again.",
        });
        return;
      }

      // Invite reached the backend — now show the caller a proper
      // "Calling…/Ringing…" screen and wait for accept/decline/timeout.
      // FIX (full-screen bug): pehle yahan router.push({ pathname:
      // "/(tabs)/call/calling", ... }) hota tha - jo screen ko Tabs ke
      // andar, Header ke neeche render karta tha (screenshot mein wahi
      // dikh raha tha). Ab koi navigation nahi - sirf setOutgoingCall()
      // set karo, OutgoingCallOverlay ((tabs)/_layout.tsx mein mounted)
      // khud hi Header sameet sab kuch cover karke full-screen upar aa
      // jayega, automatically, kisi route ke bagair.
      setOutgoingCall({
        roomName,
        calleeXnid: customer.email,
        calleeName: `${customer.first_name} ${customer.last_name}`.trim(),
        callerXnid: String(user?.email),
        callerName: getDisplayName(),
      });
    } catch (err) {
      devLog("[Contacts] /api/call/invite EXCEPTION:", err);
      Toast.show({
        type: "error",
        text1: "Couldn't start the call",
        text2: "Something went wrong. Please try again.",
      });
    } finally {
      setCallingId(null);
      callInFlightRef.current = false;
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#2C64B3", marginBottom: 16 }}>
        Call a Contact
      </Text>

      {/* FIX (style): pehle ye ek flat, single-color "strip" thi (bilkul
          simple bubble/line banner jaisi) - ab ek proper elevated white
          card hai: shadow, rounded corners, avatar, live pulsing dot, aur
          clear two-line hierarchy (name + "Tap to return") - jo baaqi app
          ke card-based design se professionally match karta hai. */}
      {isOnCall && (
        <Pressable
          onPress={() => setCallMinimized(false)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            marginBottom: 18,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
            borderWidth: 1,
            borderColor: "#EEF2F7",
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: Colors.PRIMARY,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              {getInitials(activeCall?.calleeName ?? activeCall?.displayName ?? "")}
            </Text>
            <View
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#22C55E",
                borderWidth: 2,
                borderColor: "#fff",
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700", color: "#111827", fontSize: 14 }}>
              {activeCall?.calleeName || "Ongoing call"}
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
              Call in progress · Tap to return
            </Text>
          </View>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-forward" size={18} color="#374151" />
          </View>
        </Pressable>
      )}

      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => fetchCustomers(search)}
        placeholder="Search by name or email"
        placeholderTextColor="#9CA3AF"
        editable={!isOnCall}
        style={{
          backgroundColor: "#E8EEF8",
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: 15,
          color: "#111827",
          marginBottom: 16,
          opacity: isOnCall ? 0.5 : 1,
        }}
      />

      {loading ? (
        <ActivityIndicator color={Colors.PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
                opacity: isOnCall ? 0.5 : 1,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827" }}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {item.title} · {item.email}
                </Text>
              </View>

              <Pressable
                onPress={() => handleCall(item)}
                disabled={callingId === item.id || isOnCall}
                style={{
                  backgroundColor: Colors.PRIMARY,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  opacity: callingId === item.id || isOnCall ? 0.5 : 1,
                }}
              >
                {callingId === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Call</Text>
                )}
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 40 }}>
              No contacts found.
            </Text>
          }
        />
      )}
    </View>
  );
}