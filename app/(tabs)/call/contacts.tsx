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

export default function CallContactsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const myXnid = user?.xnid;
  const setOutgoingCall = useCallStore((s) => s.setOutgoingCall);

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
      // "Calling…/Ringing…" screen and wait for accept/decline/timeout,
      // instead of jumping straight into the Jitsi WebView.
      setOutgoingCall({
        roomName,
        calleeXnid: customer.email,
        calleeName: `${customer.first_name} ${customer.last_name}`.trim(),
        callerXnid: String(user?.email),
        callerName: getDisplayName(),
      });

      router.push({
        pathname: "/(tabs)/call/calling",
        params: {
          roomName,
          calleeName: `${customer.first_name} ${customer.last_name}`.trim(),
          calleeXnid: customer.email,
          callerXnid: user?.email,
          callerName: getDisplayName(),
        },
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

      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => fetchCustomers(search)}
        placeholder="Search by name or email"
        placeholderTextColor="#9CA3AF"
        style={{
          backgroundColor: "#E8EEF8",
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: 15,
          color: "#111827",
          marginBottom: 16,
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
                disabled={callingId === item.id}
                style={{
                  backgroundColor: Colors.PRIMARY,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  opacity: callingId === item.id ? 0.6 : 1,
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