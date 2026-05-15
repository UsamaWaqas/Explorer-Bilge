import { Ionicons } from "@expo/vector-icons";
import { StackActions } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useAddDeviceStore } from "@/store/addDeviceStore";

export default function AddDeviceSuccess() {
  const router = useRouter();
  const navigation = useNavigation();
  const { resetStore } = useAddDeviceStore();

  const handleGoToDashboard = () => {
    resetStore();
    navigation.dispatch(StackActions.popToTop());
    router.replace("/(tabs)/dashboard");
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleGoToDashboard();
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View className="items-center pt-4 pb-2 px-6">
        <Image
          source={require("../../../assets/images/armIT_logo.png")}
          style={{ width: 280, height: 100 }}
          resizeMode="contain"
        />
      </View>

      {/* Head Card */}
      <View className="mx-4 mb-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <View className="h-1.5 bg-gray-200">
          <View className="h-1.5 bg-[#2B6CB0]" style={{ width: "100%" }} />
        </View>

        <View className="px-5 py-4 flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] text-[#2B6CB0] font-semibold uppercase tracking-widest mb-1">
              Step 3 of 3
            </Text>
            <Text className="text-lg font-bold text-[#374151] mb-1">
              Activation Complete
            </Text>
            <Text className="text-xs font-semibold text-[#6B7280] mb-1">
              Device Activated
            </Text>
            <Text className="text-xs text-[#9CA3AF] leading-4">
              Your device setup and subscription have been completed successfully.
            </Text>
          </View>

          <View className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 min-w-[80px] items-center">
            <Text className="text-[10px] text-emerald-500 font-medium mb-0.5">Status</Text>
            <Text className="text-sm font-bold text-emerald-600">Active</Text>
          </View>
        </View>
      </View>

      {/* Success Card */}
      <View className="mx-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 items-center">
        <View className="w-20 h-20 rounded-full bg-emerald-50 items-center justify-center mb-5">
          <Ionicons name="checkmark-circle" size={52} color="#059669" />
        </View>

        <Text className="text-xl font-bold text-[#374151] mb-3">
          Payment Successful
        </Text>

        <Text className="text-sm text-[#9CA3AF] text-center leading-5 max-w-xs">
          Thank you. Your selected plan has been activated successfully. You can now view and manage your devices from the dashboard.
        </Text>

        <Pressable
          onPress={handleGoToDashboard}
          className="mt-8 h-11 w-52 flex-row items-center justify-center gap-2 bg-white border border-[#6B7280] rounded-xl"
        >
          <Ionicons name="grid-outline" size={18} color="#2B6CB0" />
          <Text className="text-[#2B6CB0] font-bold text-sm">
            Go to Dashboard
          </Text>
        </Pressable>
      </View>

      {/* Slogan */}
      <View className="items-center mt-8 mb-4">
        <Text className="text-[#2B6CB0] text-[18px] font-bold tracking-wide">
          THE SMART WAY TO MONITOR
        </Text>
        <Text className="text-[#CBD5E0] text-[16px] font-semibold tracking-wide mt-1">
          EVERYTHING THAT MATTERS
        </Text>
      </View>
    </ScrollView>
  );
}