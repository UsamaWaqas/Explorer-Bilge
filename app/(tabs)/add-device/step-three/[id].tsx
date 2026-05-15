import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { post } from "../../../../api/apiHelper";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddDeviceStepThree() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const deviceIds: number[] = React.useMemo(() => {
    try {
      return JSON.parse(id || "[]");
    } catch {
      return [];
    }
  }, [id]);

  const [isRetrying, setIsRetrying] = useState(false);

  // ── Re-open checkout if user wants to retry payment ────────────────────────
  const handleRetryPayment = async () => {
    try {
      setIsRetrying(true);
      const response = await post(
        "/api/process-payment",
        { device_ids: deviceIds },
        {},
        false
      );

      const checkoutUrl: string = response?.checkout_url || response?.data;
      if (checkoutUrl) {
        const supported = await Linking.canOpenURL(checkoutUrl);
        if (supported) {
          await Linking.openURL(checkoutUrl);
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not get payment link. Please contact support.",
          position: "top",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong.",
        position: "top",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoToDashboard = () => {
    router.replace("/(tabs)/devices");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Button */}
      <Pressable onPress={() => router.back()} className="flex-row items-center mb-3">
        <Ionicons name="arrow-back" size={22} color="#2B6CB0" />
        <Text className="text-[#2B6CB0] ml-1 text-base">Back</Text>
      </Pressable>

      {/* Logo */}
      <View className="items-center mb-4">
        <Image
          source={require("../../../../assets/images/armIT_logo.png")}
          className="w-[260px] h-[90px]"
          resizeMode="contain"
        />
      </View>

      {/* Progress */}
      <View className="mb-2">
        <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <View className="h-2 bg-[#2B6CB0] rounded-full w-full" />
        </View>
      </View>
      <Text className="text-center text-[#4A5568] text-sm mb-6">
        Step <Text className="text-[#2B6CB0] font-semibold">3</Text> of{" "}
        <Text className="text-[#2B6CB0] font-semibold">3</Text> — Complete Payment
      </Text>

      {/* Status Card */}
      <View className="border border-[#2B6CB0] rounded-2xl p-6 mb-6 items-center bg-blue-50">
        <View className="w-16 h-16 rounded-full bg-[#2B6CB0] items-center justify-center mb-4">
          <Ionicons name="open-outline" size={32} color="white" />
        </View>
        <Text className="text-[#2B6CB0] font-bold text-xl text-center mb-2">
          Checkout Opened
        </Text>
        <Text className="text-[#4A5568] text-sm text-center leading-5">
          Your payment page has been opened in the browser.{"\n"}
          Complete the payment there to activate your{" "}
          {deviceIds.length > 1 ? `${deviceIds.length} devices` : "device"}.
        </Text>
      </View>

      {/* Instructions */}
      <View className="border border-gray-200 rounded-2xl p-5 mb-6">
        <Text className="font-semibold text-[#4A5568] mb-3">What to do next:</Text>
        {[
          "Complete the payment in the browser",
          "Return to the app after payment",
          "Your device(s) will be activated automatically",
          "Check your dashboard to view active devices",
        ].map((step, i) => (
          <View key={i} className="flex-row items-start mb-3">
            <View className="w-6 h-6 rounded-full bg-[#2B6CB0] items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">{i + 1}</Text>
            </View>
            <Text className="text-[#4A5568] text-sm flex-1 leading-5">{step}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View className="gap-y-3 mb-6">
        {/* Primary: Go to Dashboard */}
        <TouchableOpacity
          onPress={handleGoToDashboard}
          className="bg-[#2B6CB0] rounded-xl py-4 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base tracking-wide">
            GO TO DASHBOARD
          </Text>
        </TouchableOpacity>

        {/* Secondary: Retry payment link */}
        <TouchableOpacity
          onPress={handleRetryPayment}
          disabled={isRetrying}
          className="border-2 border-[#2B6CB0] rounded-xl py-4 items-center"
          activeOpacity={0.85}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#2B6CB0" />
          ) : (
            <Text className="text-[#2B6CB0] font-bold text-base tracking-wide">
              OPEN PAYMENT LINK AGAIN
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Help note */}
      <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <View className="flex-row items-center mb-1">
          <Ionicons name="information-circle-outline" size={18} color="#92400e" />
          <Text className="text-yellow-800 font-semibold ml-2">Note</Text>
        </View>
        <Text className="text-yellow-700 text-sm leading-5">
          If payment was already completed, your device(s) may already be active.
          Check your dashboard or contact support if you need help.
        </Text>
      </View>

      {/* Slogan */}
      <View className="items-center mt-2">
        <Text className="text-[#2B6CB0] text-[16px] font-bold tracking-wide">
          THE SMART WAY TO MONITOR
        </Text>
        <Text className="text-[#CBD5E0] text-[14px] font-semibold tracking-wide mt-1">
          EVERYTHING THAT MATTERS
        </Text>
      </View>
    </ScrollView>
  );
}