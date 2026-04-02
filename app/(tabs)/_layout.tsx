import GlobalDrawer from "@/components/Globalmodal";
import Header from "@/components/Header";
import NetInfoBanner from "@/components/NetInfoBanner";
import Sidebar from "@/components/Sidebar";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../assets/Color";
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
            lazy: false,
            freezeOnBlur: false,
            tabBarActiveTintColor: Colors.PRIMARY,
            tabBarInactiveTintColor: Colors.dark.text,
            tabBarStyle: {
              paddingBottom: 14,
              height: 65,
              elevation: 0,
              shadowColor: "transparent",
              borderTopWidth: 1,
              borderTopColor: "#D1D5DB",
              backgroundColor: "#F9FAFB",
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "bold",
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color }) => (
                <Ionicons name="home" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="devices"
            options={{
              title: "Devices",
              tabBarIcon: ({ color }) => (
                <Ionicons name="phone-portrait" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="add"
            options={{
              title: "Add",
              tabBarIcon: ({ color }) => (
                <View
                  style={{
                    backgroundColor: "#4CAF50",
                    width: 44,
                    height: 44,
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
                  <Ionicons name="add" size={32} color="white" />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="events"
            options={{
              title: "Events",
              tabBarIcon: ({ color }) => (
                <Ionicons name="calendar" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarIcon: ({ color }) => (
                <Ionicons name="settings" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{ href: null }}
          />
        </Tabs>

        {/* ✅ NetInfoBanner useNetwork() hook se store read karta hai — koi alag subscription nahi */}
        <NetInfoBanner />

        <GlobalDrawer>
          <Sidebar />
        </GlobalDrawer>
      </SafeAreaView>
    </>
  );
};

export default TabLayout;