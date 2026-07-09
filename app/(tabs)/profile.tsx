import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { get, post, put } from "../../api/apiHelper";
import { useAuthStore } from "../../store/authStore";
// import { isAlreadyOnCall } from "../../store/callStore";
import { buildPrivateRoom } from "../../utils/roomBuilder";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ""}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        style={{
          backgroundColor: "#E8EEF8",
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: "#111827",
        }}
      />
    </View>
  );
}

export default function MyProfile() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const router = useRouter();

  const userDetail = useAuthStore((state) => state.userDetail);
  const setUserDetail = useAuthStore((state) => state.setUserDetail);

  const [fetchLoading, setFetchLoading] = useState(true);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");

  const [joinRoomInput, setJoinRoomInput] = useState("");
  const myXnid = user?.Xnid ?? String(userId);

  async function fetchUserDetails() {
    setFetchLoading(true);
    const res = await get(`/api/user/details/${userId}`);
    if (!res?.error && res?.success) {
      const d = res.data;
      setUserDetail({
        phone_notification: !!d?.phone_notification,
        email_notification: !!d?.email_notification,
        notification_phone: d?.notification_phone ?? "",
        notification_email: d?.notification_email ?? "",
      });
      setFirstName(d?.first_name || "");
      setLastName(d?.last_name || "");
      setEmail(d?.email || "");
      setPhoneNumber(d?.phone_number ? String(d.phone_number) : "");
      setNotificationPhone(d?.notification_phone || "");
      setNotificationEmail(d?.notification_email || "");
      setAddress1(d?.address_1 || "");
      setAddress2(d?.address_2 || "");
      setCity(d?.city || "");
      setPostalCode(d?.postal_code || "");
      setCountry(d?.country || "");
      setState(d?.state || "");
    }
    setFetchLoading(false);
  }

  useEffect(() => {
    fetchUserDetails();
  }, []);

  function getDisplayName() {
    return firstName
      ? `${firstName} ${lastName}`.trim()
      : `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User";
  }

  function startCall(roomName: string) {
    // FIX: ye function pehle activeRoomName bilkul check nahi karta tha —
    // isi wajah se sidebar → Profile → "Join Call"/"Generate & Share Link"
    // se ongoing call ke doran bhi ek dusra call (dusri WebView instance)
    // start ho jata tha, jo camera/state conflict paida karta tha. Ab har
    // call yahin se guard hoti hai.
    // if (isAlreadyOnCall()) {
    //   Alert.alert(
    //     "Already on a call",
    //     "You're currently on an active call. Please end it before starting a new one.",
    //   );
    //   return;
    // }
    router.push({
      pathname: "/(tabs)/call/[roomName]",
      params: {
        roomName,
        displayName: getDisplayName(),
        xnid: myXnid,
      },
    });
  }

  async function handleGenerateAndShare() {
    const roomName = buildPrivateRoom(myXnid, `${myXnid}-${Date.now()}`);
    await Share.share({
      message: `Join my goARMIT video call. Room: ${roomName}`,
    });
    startCall(roomName);
  }

  function handleJoinCall() {
    const room = joinRoomInput.trim();
    if (!room) {
      Alert.alert("Enter Room Name", "Please enter the room name to join.");
      return;
    }
    startCall(room);
  }

  async function toggleSwitch(type: string, val: boolean) {
    const key = type === "email" ? "email_notification" : "phone_notification";
    setUserDetail({
      phone_notification: !!(userDetail?.phone_notification),
      email_notification: !!(userDetail?.email_notification),
      notification_phone: userDetail?.notification_phone ?? "",
      notification_email: userDetail?.notification_email ?? "",
      [key]: val,
    });
    setIsLoading(type);
    try {
      const res = await post("/api/toggle-notification", { type });
      if (!res?.error && res?.success) {
        const updated = res?.data;
        if (updated) {
          setUserDetail({
            phone_notification: !!updated.phone_notification,
            email_notification: !!updated.email_notification,
            notification_phone: updated.notification_phone ?? userDetail?.notification_phone ?? "",
            notification_email: updated.notification_email ?? userDetail?.notification_email ?? "",
          });
        }
      } else {
        setUserDetail({
          phone_notification: !!(userDetail?.phone_notification),
          email_notification: !!(userDetail?.email_notification),
          notification_phone: userDetail?.notification_phone ?? "",
          notification_email: userDetail?.notification_email ?? "",
          [key]: !val,
        });
      }
    } catch {
      setUserDetail({
        phone_notification: !!(userDetail?.phone_notification),
        email_notification: !!(userDetail?.email_notification),
        notification_phone: userDetail?.notification_phone ?? "",
        notification_email: userDetail?.notification_email ?? "",
        [key]: !val,
      });
    } finally {
      setIsLoading(null);
    }
  }

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const res = await put(`/api/detail-user/${userId}`, {
        first_name: firstName,
        last_name: lastName,
        email,
        phoneNumber,
        notificationNumber: notificationPhone,
        notificationEmail,
        firstAddress: address1,
        secondAddress: address2,
        country,
        state,
        city,
        zipCode: postalCode,
      });
      if (!res?.error && res?.success) {
        await fetchUserDetails();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#2C64B3", marginBottom: 20 }}>
          My Profile
        </Text>

        <Field label="First Name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        <Field label="Last Name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

        {/* Notification Phone — comma separated alag alag fields */}
        {notificationPhone.split(",").filter(Boolean).length > 0 ? (
          notificationPhone.split(",").filter(Boolean).map((phone, i) => (
            <Field
              key={`phone-${i}`}
              label={i === 0 ? "Notification Phone Number" : undefined}
              value={phone.trim()}
              onChangeText={(val) => {
                const phones = notificationPhone.split(",");
                phones[i] = val;
                setNotificationPhone(phones.join(","));
              }}
              keyboardType="phone-pad"
            />
          ))
        ) : (
          <Field
            label="Notification Phone Number"
            value={notificationPhone}
            onChangeText={setNotificationPhone}
            keyboardType="phone-pad"
          />
        )}

        {/* Notification Email — comma separated alag alag fields */}
        {notificationEmail.split(",").filter(Boolean).length > 0 ? (
          notificationEmail.split(",").filter(Boolean).map((em, i) => (
            <Field
              key={`email-${i}`}
              label={i === 0 ? "Notification Email Address" : undefined}
              value={em.trim()}
              onChangeText={(val) => {
                const emails = notificationEmail.split(",");
                emails[i] = val;
                setNotificationEmail(emails.join(","));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ))
        ) : (
          <Field
            label="Notification Email Address"
            value={notificationEmail}
            onChangeText={setNotificationEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}

        <Field label="Address 1" value={address1} onChangeText={setAddress1} />
        <Field label="Address 2" value={address2} onChangeText={setAddress2} />
        <Field label="City" value={city} onChangeText={setCity} autoCapitalize="words" />
        <Field label="Postal Code" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />
        <Field label="Country" value={country} onChangeText={setCountry} autoCapitalize="words" />
        <Field label="State" value={state} onChangeText={setState} autoCapitalize="words" />

        
          <View style={{ marginTop: 8, marginBottom: 20 }}>
          {/* <Text style={{ fontSize: 16, fontWeight: "700", color: "#2C64B3", marginBottom: 14 }}>
             Video Call
          </Text> */}

        {/* <Pressable
            onPress={handleGenerateAndShare}
            style={{
              backgroundColor: "#16A34A",
              paddingVertical: 13,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
              📤 Start Call & Share Room
            </Text>
          </Pressable> */}
          {/* <Pressable
  onPress={() => router.push("/(tabs)/call/contacts")}
  style={{
    backgroundColor: "#2C64B3",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  }}
>
  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
    📞 Call a contact
  </Text>
</Pressable> */}

          {/* <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 6 }}>
            Have a room name? Join here:
          </Text>
          <TextInput
            value={joinRoomInput}
            onChangeText={setJoinRoomInput}
            placeholder="Enter room name..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            style={{
              backgroundColor: "#E8EEF8",
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: "#111827",
              marginBottom: 10,
            }} */}
          {/* /> */}
          {/* <Pressable
            onPress={handleJoinCall}
            style={{
              backgroundColor: "#2C64B3",
              paddingVertical: 13,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
              Join Call
            </Text>
          </Pressable> */}
        </View>   

        
        <View style={{ alignItems: "flex-end", marginTop: 8 }}>
          <Pressable
            onPress={handleSave}
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? "#5c85c0" : "#2C64B3",
              paddingVertical: 12,
              paddingHorizontal: 28,
              borderRadius: 8,
              minWidth: 140,
              alignItems: "center",
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                Save Changes
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}