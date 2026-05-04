import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { get, post, put } from "../../api/apiHelper";
import AnimatedSwitch from "../../components/Switch";
import { useAuthStore } from "../../store/authStore";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 6 }}>
        {label}
      </Text>
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

function ToggleField({
  label,
  sublabel,
  value,
  onToggle,
  loading,
  fetchLoading,
}: {
  label: string;
  sublabel: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  loading: boolean;
  fetchLoading: boolean;
}) {
  const isDisabled = loading || fetchLoading;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          backgroundColor: "#E8EEF8",
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 15, color: "#111827" }}>{sublabel}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {(loading || fetchLoading) && (
            <ActivityIndicator size="small" color="#2C64B3" />
          )}
          <View
            style={{
              opacity: isDisabled ? 0.5 : 1,
              pointerEvents: isDisabled ? "none" : "auto",
            }}
          >
            <AnimatedSwitch
              value={value}
              onValueChange={() => !isDisabled && onToggle(!value)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function MyProfile() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

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

  // ── Fetch user details on mount ─────────────────────────────────────────
  useEffect(() => {
    async function fetchUserDetails() {
      setFetchLoading(true);
      const res = await get(`/api/user/details/${userId}`);
      if (!res?.error && res?.success) {
        const d = res.data;
        console.log("Fetched User Detail:", d);

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
    fetchUserDetails();
  }, []);

  // ── Toggle notification switches ────────────────────────────────────────
  async function toggleSwitch(type: string, val: boolean) {
    const key =
      type === "email" ? "email_notification" : "phone_notification";

    
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
            notification_phone:
              updated.notification_phone ??
              userDetail?.notification_phone ??
              "",
            notification_email:
              updated.notification_email ??
              userDetail?.notification_email ??
              "",
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

  // ── Save profile changes ─────────────────────────────────────────────────
  async function handleSave() {
    setIsSubmitting(true);
    try {
      await put(`/api/detail-user/${userId}`, {
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
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#2C64B3",
            marginBottom: 20,
          }}
        >
          My Profile
        </Text>

        <Field
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        <Field
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <Field
          label="Notification Phone Number"
          value={notificationPhone}
          onChangeText={setNotificationPhone}
          keyboardType="phone-pad"
        />
        <Field
          label="Notification Email Address"
          value={notificationEmail}
          onChangeText={setNotificationEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Address 1"
          value={address1}
          onChangeText={setAddress1}
        />
        <Field
          label="Address 2"
          value={address2}
          onChangeText={setAddress2}
        />
        <Field
          label="City"
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />
        <Field
          label="Postal Code"
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="numeric"
        />
        <Field
          label="Country"
          value={country}
          onChangeText={setCountry}
          autoCapitalize="words"
        />
        <Field
          label="State"
          value={state}
          onChangeText={setState}
          autoCapitalize="words"
        />
{/* 
        <ToggleField
          label="Phone Notification Toggle"
          sublabel="TEXT / SMS"
          value={!!userDetail?.phone_notification}
          onToggle={(v) => toggleSwitch("phone", v)}
          loading={isLoading === "phone"}
          fetchLoading={fetchLoading}
        /> */}
        {/* <ToggleField
          label="Email Notification Toggle"
          sublabel="EMAIL NOTIFI"
          value={!!userDetail?.email_notification}
          onToggle={(v) => toggleSwitch("email", v)}
          loading={isLoading === "email"}
          fetchLoading={fetchLoading}
        /> */}

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
              <Text
                style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}
              >
                Save Changes
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}