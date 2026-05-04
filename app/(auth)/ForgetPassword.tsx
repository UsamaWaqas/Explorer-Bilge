import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import GlobalInput from "../../components/Input";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import Toast from 'react-native-toast-message';
import { post } from "../../api/apiHelper";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
});

export default function ForgetPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [showAccountNotFound, setShowAccountNotFound] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    const response = await post("/api/users/forget-password", data, {}, false);
    setIsLoading(false);

    if (response?.isOffline) {
      Toast.show({ type: 'info', text1: 'Offline', text2: 'No internet connection', position: 'top', visibilityTime: 3000 });
      return;
    }

    if (response?.error || response?.message !== "success") {
      setShowAccountNotFound(true);
      return;
    }

    setSuccessMessage(true);
  };

  return (
    <ScrollView
      className="flex-1 bg-white px-6"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center mb-12 mt-8">
        <Image
          source={require("../../assets/images/armIT_logo.png")}
          className="w-[280px] h-[100px]"
          resizeMode="contain"
        />
      </View>

      {!successMessage ? (
        <View>
          <Pressable className="mb-6" onPress={() => router.back()}>
            <Text className="text-[#2B6CB0] text-[15px] font-medium underline">Back to login</Text>
          </Pressable>

          {showAccountNotFound ? (
            <View className="mb-8 items-center">
              <Text className="text-[22px] font-bold text-red-500 mb-2">Account Not Found!</Text>
              <Text className="text-[16px] text-[#718096] text-center leading-[24px]">No account found with that email address.</Text>
            </View>
          ) : (
            <View className="mb-8">
              <Text className="text-[28px] font-bold text-[#2B6CB0] mb-3">Forgot Password?</Text>
              <Text className="text-[16px] text-[#718096] leading-[24px]">Tell us your email address, and we'll get you back on track in no time.</Text>
            </View>
          )}

          <View className="mb-10">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View className="mb-2">
                  <GlobalInput
                    placeholder="Email Address"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    inputClassName="h-12"
                    leftIcon={<Ionicons name="mail-outline" size={20} color="gray" />}
                  />
                  {errors.email && (
                    <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>
                  )}
                </View>
              )}
            />
          </View>

          <View className="items-center mb-12">
            <Pressable
              className="bg-white border-2 h-14 w-32 border-[#2B6CB0] rounded-lg justify-center items-center"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#2B6CB0" />
              ) : (
                <Text className="text-[#2B6CB0] text-[17px] font-bold tracking-widest text-center">NEXT</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <Pressable className="mb-6" onPress={() => router.back()}>
            <Text className="text-[#2B6CB0] text-[15px] font-medium underline">Back to login</Text>
          </Pressable>

          <View className="items-center mt-8 mb-8">
            <Text className="text-[22px] font-bold text-[#64BC78] mb-3">Successfully Sent</Text>
            <Text className="text-[16px] text-[#718096] text-center leading-[24px]">
              Password reset request was sent successfully!{"\n"}Please check your email to reset your password.
            </Text>
          </View>
        </View>
      )}

      <View className="items-center mb-8 mt-auto">
        <Text className="text-[#2B6CB0] text-[18px] font-bold tracking-wide">THE SMART WAY TO MONITOR</Text>
        <Text className="text-[#CBD5E0] text-[16px] font-semibold tracking-wide mt-1">EVERYTHING THAT MATTERS</Text>
      </View>
    </ScrollView>
  );
}