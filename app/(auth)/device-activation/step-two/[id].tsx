import GlobalInput from "@/components/Input";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { post } from "../../../../api/apiHelper";



const planItems = [
  "Unlimited sensor activity monitoring",
  "Unlimited ArmIt Alerts for eMail",
  "Unlimited ArmIt Alerts for SMS Messages",
  "To USA cell phone numbers",
  "Unlimited Data Storage",
  "Customer Dashboard to track and manage",
  "All activated devices",
];



interface StepTwoForm {
  promoCode: string;
}



export default function StepTwo() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { id: deviceId, userId } = useLocalSearchParams<{
    id: string;
    userId: string;
  }>();

  const { control, handleSubmit } = useForm<StepTwoForm>({
    defaultValues: { promoCode: "" },
  });

  const onSubmit = async (data: StepTwoForm) => {
    setIsLoading(true);
    try {
      const response = await post(
        "/api/process-payment",
        {
          id: deviceId,
          user_id: userId,
          amount: "75",
          promoCode: data.promoCode,
        },
        {},
        false
      );

      if (response?.isOffline) {
        Toast.show({
          type: "info",
          text1: "Offline",
          text2: "No internet connection",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      if (response?.error) {
        Toast.show({
          type: "error",
          text1: "Payment Failed",
          text2: response.message || "Failed to process payment",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      const paymentUrl = response;
      if (paymentUrl && typeof paymentUrl === "string") {
        const supported = await Linking.canOpenURL(paymentUrl);
        if (supported) {
          await Linking.openURL(paymentUrl);
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Cannot open payment link",
            position: "top",
            visibilityTime: 3000,
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to process payment. Please try again.",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <ScrollView
        className="flex-1 bg-white px-6"
        contentContainerStyle={{
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="items-center mb-4">
          <Image
            source={require("../../../../assets/images/armIT_logo.png")}
            className="w-[280px] h-[100px]"
            resizeMode="contain"
          />
        </View>

        {/* Progress Bar */}
        <View className="mb-2">
          <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-2 bg-[#2B6CB0] rounded-full" style={{ width: "66%" }} />
          </View>
        </View>

        {/* Step Indicator */}
        <Text className="text-center text-[#4A5568] text-base mb-6">
          Step <Text className="text-[#2B6CB0] font-semibold">2</Text> of{" "}
          <Text className="text-[#2B6CB0] font-semibold">3</Text>
        </Text>

        {/* Promo Code Input */}
        <View className="mb-6">
          <Controller
            control={control}
            name="promoCode"
            render={({ field: { onChange, value } }) => (
              <GlobalInput
                placeholder="Special Promotion Code"
                value={value}
                onChangeText={onChange}
                inputClassName="h-12"
                leftIcon={
                  <Ionicons name="pricetag-outline" size={20} color="gray" />
                }
              />
            )}
          />
        </View>

        {/* Plan Card */}
        <View className="border border-gray-300 rounded-2xl px-5 py-6 mb-6">

          {/* Plan Title Row */}
          <View className="flex-row items-center justify-between flex-wrap gap-2 mb-4">
            <Text className="text-[#4A5568] text-lg font-bold flex-1">
              myARMIT Unlimited{"\n"}12 Months
            </Text>

            {/* Price Badge */}
            <View className="bg-[#2B6CB0] rounded-full w-20 h-20 justify-center items-center">
              <Text className="text-white text-xs font-semibold">Only</Text>
              <Text className="text-white text-xl font-bold">$75</Text>
              <Text className="text-white text-[10px]">/ year</Text>
            </View>
          </View>

          {/* Divider */}
          <View className="border-t border-gray-200 mb-4" />

          {/* Plan Features */}
          <View className="gap-2 mb-6">
            {planItems.map((item, index) => (
              <View key={index} className="flex-row items-center gap-3">
                <View className="w-5 h-5 rounded-full bg-[#2B6CB0] justify-center items-center">
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
                <Text className="text-[#4A5568] text-sm flex-1">{item}</Text>
              </View>
            ))}
          </View>

          {/* Select Button */}
          <View className="items-center">
            <Pressable
              className="bg-white border-2 h-14 w-32 border-[#2B6CB0] rounded-lg justify-center items-center"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#2B6CB0" />
              ) : (
                <Text className="text-[#2B6CB0] text-[14px] font-bold tracking-widest">
                  SELECT
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Slogan */}
        <View className="items-center mb-8">
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
