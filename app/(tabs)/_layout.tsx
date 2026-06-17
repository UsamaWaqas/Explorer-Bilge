import GlobalDrawer from "@/components/Globalmodal";
import Header from "@/components/Header";
import NetInfoBanner from "@/components/NetInfoBanner";
import Sidebar from "@/components/Sidebar";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Colors } from "../../assets/Color";
import { toastConfig } from "../../components/ToastConfig";
import IncomingCallModal from "@/components/IncomingCallModal";

const TabLayout = () => {
  const pathname = usePathname();

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
        </Tabs>

        <NetInfoBanner />
        <GlobalDrawer>
          <Sidebar />
        </GlobalDrawer>
      </SafeAreaView>
      <IncomingCallModal />  

      <Toast
        config={toastConfig}
        position="top"
        topOffset={60}
        visibilityTime={3000}
      />
    </>
  );
};

export default TabLayout;