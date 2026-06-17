import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { get, post } from "../../../api/apiHelper";
import { Colors } from "../../../assets/Color";
import { useAuthStore } from "../../../store/authStore";
import { useCallStore } from "../../../store/callStore";
import { buildPrivateRoom } from "../../../utils/roomBuilder";

interface Customer {
  id: number;
  xnid: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
}

export default function CallContactsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const myXnid = user?.xnid;
  console.log("xnid..................................................................", myXnid,user);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [callingId, setCallingId] = useState<number | null>(null);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);

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
      // Don't show yourself in the list
      setCustomers(list.filter((c) => c.xnid !== myXnid));
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
    const roomName = buildPrivateRoom(myXnid, customer.xnid);

    setCallingId(customer.id);
    try {
      // Backend should: trigger Pusher "incoming-call" event on the
      // target user's channel (notifi-sensor-data-<targetUserId>) with
      // { roomName, callerName, callerXnid }.
      await post(
        "/api/call/invite",
        {
          targetXnid: customer.xnid,
          roomName,
          callerName: getDisplayName(),
          callerXnid: myXnid,
        },
        {},
        false, // don't show error toast if this endpoint isn't ready yet
      );
    } catch (err) {
      console.warn("[Call] invite failed, continuing to join room anyway", err);
    } finally {
      setCallingId(null);
    }

    router.push({
      pathname: "/(tabs)/call/[roomName]",
      params: {
        roomName,
        displayName: getDisplayName(),
        xnid: myXnid,
      },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#2C64B3", marginBottom: 16 }}>
        Call a Contact
      </Text>

      {/* TEMPORARY TEST BUTTON — simulates an incoming-call Pusher event
          without needing the backend /api/call/invite endpoint. Remove
          once backend wiring is confirmed. */}
      <Pressable
        onPress={() =>
          setIncomingCall({
            roomName: "test-room-123",
            callerName: "Test Caller",
            callerXnid: "xnid:user:dummy",
          })
        }
        style={{ backgroundColor: "#999", padding: 12, borderRadius: 8, marginBottom: 16 }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>🧪 Simulate Incoming Call</Text>
      </Pressable>

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