import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { get, post } from "../api/apiHelper";
import { logoutService } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import { useDrawerStore } from "../store/ModalStore";
import { UserDetail } from "../types/ auth.types";
import GlobalInput from "./Input";
import AnimatedSwitch from "./Switch";


export default function Sidebar() {
  const router = useRouter();
  const close = useDrawerStore((s) => s.close);
  const isOpen = useDrawerStore((s) => s.isOpen);

   const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userDetail = useAuthStore((state) => state.userDetail);
  const setUserDetail = useAuthStore((state) => state.setUserDetail);

  const [sidebarName, setSidebarName] = useState(
    user ? `${user.first_name} ${user.last_name}`.trim() : ""
  );
  const [sidebarEmail, setSidebarEmail] = useState(user?.email || "");

  const [textSmsEnabled, setTextSmsEnabled] = useState<boolean>(
    !!userDetail?.phone_notification
  );
  const [emailNotifEnabled, setEmailNotifEnabled] = useState<boolean>(
    !!userDetail?.email_notification
  );
  const [togglingPhone, setTogglingPhone] = useState(false);
  const [togglingEmail, setTogglingEmail] = useState(false);

  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [emailAddresses, setEmailAddresses] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchUserDetail() {
      try {
        const res = await get(`/api/user/details/${user?.id}`);
        if (res?.success && res?.data) {
          const d = res.data;
          setSidebarName(`${d.first_name || ""} ${d.last_name || ""}`.trim());
          setSidebarEmail(d.email || "");
          setTextSmsEnabled(!!d.phone_notification);
          setEmailNotifEnabled(!!d.email_notification);

          const phones = typeof d.notification_phone === "string"
            ? d.notification_phone.split(",").map((p: string) => p.trim()).filter(Boolean)
            : Array.isArray(d.notification_phone) ? d.notification_phone : [];

          const emails = typeof d.notification_email === "string"
            ? d.notification_email.split(",").map((e: string) => e.trim()).filter(Boolean)
            : Array.isArray(d.notification_email) ? d.notification_email : [];

          setPhoneNumbers(phones);
          setEmailAddresses(emails);

          setUserDetail({
            phone_notification: !!d.phone_notification,
            email_notification: !!d.email_notification,
            notification_phone: d.notification_phone ?? "",
            notification_email: d.notification_email ?? "",
          });
        }
      } catch (error) {
        console.error("Error fetching user detail:", error);
      }
    }
    fetchUserDetail();
  }, [isOpen]);

  const getInitials = (name: string) => {
    if (!name) return "MN";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  async function toggleSwitch(type: "phone" | "email") {
    const isPhone = type === "phone";

    if (isPhone) setTextSmsEnabled((prev) => !prev);
    else setEmailNotifEnabled((prev) => !prev);

    if (isPhone) setTogglingPhone(true);
    else setTogglingEmail(true);

    try {
      const res = await post("/api/toggle-notification", { type }, {}, true);

      if (res?.success) {
        const key = isPhone ? "phone_notification" : "email_notification";
        const value: number = res?.data?.[key] ?? 0;

        const updated: UserDetail = {
          ...(userDetail as UserDetail),
          [key]: value,
        };

        setUserDetail(updated);

        if (isPhone) setTextSmsEnabled(!!value);
        else setEmailNotifEnabled(!!value);
      } else {
        if (isPhone) setTextSmsEnabled((prev) => !prev);
        else setEmailNotifEnabled((prev) => !prev);
      }
    } catch (error) {
      console.error("error toggling notification", error);
      if (isPhone) setTextSmsEnabled((prev) => !prev);
      else setEmailNotifEnabled((prev) => !prev);
    } finally {
      if (isPhone) setTogglingPhone(false);
      else setTogglingEmail(false);
    }
  }

  const handleLogout = async () => {

    close();
     queryClient.clear();   
    await logoutService();
    router.replace("/(auth)/Login");
  };

  const handleEditProfile = () => {
    close();
    router.push("/(tabs)/profile");
  };

  const handleNotifiAlerts = () => {
    close();
    router.push("/(tabs)/configure-alerts");
  };

  const handleAddDevice = () => {
    close();
    router.push({
      pathname: "/(tabs)/add-device",
      params: { id: String(user?.euid ?? "") },
    });
  };

  const handleSupport = () => {
    close();
    router.push("/(tabs)/call/contacts");
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="p-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text className="text-[#2C64B3] text-lg  font-bold mb-2">PROFILE</Text>
      <View className="flex flex-col gap-y-3">

        {/* User Info Card */}
        <View className="bg-[#C9D0D3] h-24 border overflow-hidden border-[#9f9f9f] w-full rounded-md flex-row items-center px-3">
          <View className="w-14 h-14 bg-[#2C64B3] rounded-full items-center justify-center">
            <Text className="text-white text-xl font-bold">
              {getInitials(sidebarName)}
            </Text>
          </View>
         <View className="flex-1 ml-3 overflow-hidden">
  <Text
    className="text-gray-800 text-xl font-bold"
    numberOfLines={1}
    ellipsizeMode="tail"
  >
    {sidebarName || "My Profile"}
  </Text>

  <Text
    className="text-[#6B7280] text-sm"
    numberOfLines={1}
    ellipsizeMode="tail"
  >
    {sidebarEmail || "My Account"}
  </Text>
</View>
        </View>

        {/* Edit Profile + Notif Alerts */}
        <View className="flex-row gap-x-2">
          <Pressable
            onPress={handleEditProfile}
            className="bg-[#C9D0D3] h-28 flex-1 border border-[#9f9f9f] rounded-md items-center justify-center"
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="person-circle-outline" size={28} color="#6B7280" />
              <Text className="text-[#6B7280] text-lg font-bold ml-1">EDIT</Text>
            </View>
            <Text className="text-[#6B7280] text-lg font-bold">PROFILE</Text>
          </Pressable>

          <Pressable
            onPress={handleNotifiAlerts}
            className="bg-[#C9D0D3] h-28 flex-1 border border-[#9f9f9f] rounded-md items-center justify-center"
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="wifi" size={28} color="#6B7280" />
              <Text className="text-[#6B7280] text-lg font-bold ml-1">NOTIFI</Text>
            </View>
            <Text className="text-[#6B7280] text-lg font-bold">ALERTS</Text>
          </Pressable>
        </View>

        {/* Notifications Card */}
        <View className="bg-[#C9D0D3] border border-[#9f9f9f] w-full rounded-md p-3">

          {/* SMS */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-[#6B7280] text-lg font-bold">TEXT / SMS</Text>
            <View
              pointerEvents={togglingPhone ? "none" : "auto"}
              style={{ opacity: togglingPhone ? 0.5 : 1 }}
            >
              <AnimatedSwitch
                value={textSmsEnabled}
                onValueChange={() => toggleSwitch("phone")}
              />
            </View>
          </View>

          {phoneNumbers.length > 0 ? (
            <View className="gap-y-2">
              {phoneNumbers.map((phone, i) => (
                <GlobalInput
                  key={i}
                  placeholder="Phone number"
                  value={phone}
                  editable={false}
                  inputClassName="h-12 text-[#6B7280]"
                  keyboardType="phone-pad"
                  leftIcon={<Ionicons name="call-outline" size={18} color="gray" />}
                />
              ))}
            </View>
          ) : (
            <GlobalInput
              placeholder="Phone number"
              value=""
              editable={false}
              inputClassName="h-12 text-[#6B7280]"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color="gray" />}
            />
          )}

          <Text className="text-[#6B7280] text-xs mt-1 mb-4">
            Multiple phones entered separated by [,] comma
          </Text>

          {/* EMAIL */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-[#6B7280] text-lg font-bold">EMAIL NOTIFI</Text>
            <View
              pointerEvents={togglingEmail ? "none" : "auto"}
              style={{ opacity: togglingEmail ? 0.5 : 1 }}
            >
              <AnimatedSwitch
                value={emailNotifEnabled}
                onValueChange={() => toggleSwitch("email")}
              />
            </View>
          </View>

          {emailAddresses.length > 0 ? (
            <View className="gap-y-2">
              {emailAddresses.map((email, i) => (
                <GlobalInput
                  key={i}
                  placeholder="Email address"
                  value={email}
                  editable={false}
                  inputClassName="h-12 text-[#6B7280]"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="mail-outline" size={18} color="gray" />}
                />
              ))}
            </View>
          ) : (
            <GlobalInput
              placeholder="Email address"
              value=""
              editable={false}
              inputClassName="h-12 text-[#6B7280]"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color="gray" />}
            />
          )}

          <Text className="text-[#6B7280] text-xs mt-1">
            Multiple email entered separated by [,] comma
          </Text>
        </View>

        {/* Support */}
        <Pressable
          onPress={handleSupport}
          className="bg-[#7B868C] h-16 w-full rounded-md flex-row items-center px-4"
        >
          <Ionicons name="headset" size={32} color="#C9D0D3" />
          <Text className="text-[#C9D0D3] text-xl font-bold ml-3">SUPPORT</Text>
        </Pressable>
        

        {/* Add Device */}
        <Pressable
          onPress={handleAddDevice}
          className="bg-[#7B868C] h-16 w-full rounded-md flex-row items-center px-4"
        >
          <Ionicons name="add-circle-outline" size={32} color="#C9D0D3" />
          <Text className="text-[#C9D0D3] text-xl font-bold ml-3">ADD DEVICE</Text>
        </Pressable>

        {/* Log Out */}
        <Pressable
          className="bg-[#7B868C] h-16 w-full rounded-md items-center justify-center"
          onPress={handleLogout}
        >
          <Text className="text-[#C9D0D3] text-xl font-bold">LOG OUT</Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}