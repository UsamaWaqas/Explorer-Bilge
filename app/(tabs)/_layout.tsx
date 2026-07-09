// import CallOverlay from "@/components/CallOverlay";
import GlobalDrawer from "@/components/Globalmodal";
import Header from "@/components/Header";
import IncomingCallModal from "@/components/IncomingCallModal";
import NetInfoBanner from "@/components/NetInfoBanner";
import Sidebar from "@/components/Sidebar";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../assets/Color";
import { useAuthStore } from "../../store/authStore";

const TabLayout = () => {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    AsyncStorage.setItem("lastRoute", pathname);
  }, [pathname]);

  return (
    <>
      <SafeAreaView style={{ backgroundColor: Colors.PRIMARY }} edges={["top"]} />
      <StatusBar style="light" backgroundColor={Colors.PRIMARY} />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        edges={["bottom", "left", "right"]}
      >
        <Header />

        <Tabs
          screenOptions={{
            headerShown: false,
            lazy: true,
            freezeOnBlur: false,
            tabBarActiveTintColor: Colors.PRIMARY,
            tabBarInactiveTintColor: Colors.dark.text,
            tabBarStyle: {
              paddingBottom: 8,
              height: 60,
              elevation: 0,
              shadowColor: "transparent",
              borderTopWidth: 1,
              borderTopColor: "#D1D5DB",
              backgroundColor: "#F9FAFB",
            },
            tabBarLabel: ({ children, color }) => ( 
              <Text
                style={{ fontSize: 10, fontWeight: "bold", color }}
                allowFontScaling={false}
              >
                {children}
              </Text>
            ),
          }}
        >
          {/* 1 — Dashboard */}
          <Tabs.Screen
            name="dashboard"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color }) => (
                <Ionicons name="home" size={24} color={color} />
              ),
            }}
          />

          {/* 2 — Devices */}
          <Tabs.Screen
            name="devices"
            options={{
              title: "Devices",
              tabBarIcon: ({ color }) => (
                <Ionicons name="phone-portrait" size={24} color={color} />
              ),
            }}
          />

          {/* 3 — Add */}
          <Tabs.Screen
            name="add-device"
            options={{
              title: "Add",
              tabBarIcon: () => (
                <View
                  style={{
                    backgroundColor: "#4CAF50",
                    width: 48,
                    height: 48,
                    borderRadius: 28,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 20,
                    elevation: 5,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  }}
                >
                  <Ionicons name="add" size={28} color="white" />
                </View>
              ),
            }}
            listeners={{
              tabPress: (e) => {
                // Default tab-press navigation carries no params, so the
                // add-device screen ends up with an undefined id. Intercept
                // it and push manually with the current user's id.
                e.preventDefault();
                router.push({
                  pathname: "/(tabs)/add-device",
                  params: { id: String(user?.euid ?? "") },
                });
              },
            }}
          />

          {/* 4 — Events */}
          <Tabs.Screen
            name="events"
            options={{
              title: "Events",
              tabBarIcon: ({ color }) => (
                <Ionicons name="calendar" size={24} color={color} />
              ),
            }}
          />

          {/* 5 — Settings */}
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarIcon: ({ color }) => (
                <Ionicons name="settings" size={24} color={color} />
              ),
            }}
          />

          {/* ── Hidden ── */}
          <Tabs.Screen name="profile" options={{ href: null }} />
          <Tabs.Screen name="configure-alerts" options={{ href: null }} />
          <Tabs.Screen name="device-health-schedules" options={{ href: null }} />
          <Tabs.Screen name="Change-password" options={{ href: null }} />
          <Tabs.Screen name="notification-rules" options={{ href: null }} />
          <Tabs.Screen name="device-events/[id]" options={{ href: null }} />
          <Tabs.Screen name="add-device/step-two/[id]" options={{ href: null }} />
          <Tabs.Screen name="add-device/step-three/[id]" options={{ href: null }} />
          <Tabs.Screen name="add-device/checkout" options={{ href: null }} />
          <Tabs.Screen name="add-device/success" options={{ href: null }} />
          {/* <Tabs.Screen name="add-device/success" options={{ href: null }} /> */}
          <Tabs.Screen
            name="call/[roomName]"
            options={{
              href: null,
              tabBarStyle: { display: "none" },
            }}
          />
          <Tabs.Screen
  name="call/contacts"
  options={{
    href: null,
    tabBarStyle: { display: "none" },
  }}
/>
 <Tabs.Screen
  name="call/calling"
  options={{
    href: null,
    tabBarStyle: { display: "none" },
  }}
/>
        </Tabs>

        <NetInfoBanner />
        <GlobalDrawer>
          <Sidebar />
        </GlobalDrawer>
      </SafeAreaView>
      <IncomingCallModal />
      {/* FIX (persistent call): mounted here, outside <Tabs>, so it never
          unmounts on navigation — it renders the active call full-screen
          or as a minimized floating bubble, driven entirely by
          store/callStore's `activeCall` state. */}
      {/* <CallOverlay /> */}
      {/* Toast is mounted once, at the app root (app/_layout.tsx).
          A second instance here caused Toast.show() to sometimes target
          a stale/unmounted ref on iOS, so toasts silently failed to render. */}
    </>
  );
};

export default TabLayout;