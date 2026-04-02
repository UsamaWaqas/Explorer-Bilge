import GlobalInput from "@/components/Input";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";

import { post } from "../../api/apiHelper";


const schema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Min 6 characters").required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  
  const onSubmit = async (data: any) => {
  setIsLoading(true);

  const response = await post(
    "/api/users/register",
    data,
    {},
    false
  );

  setIsLoading(false);

  // ✅ Offline check
  if (response?.isOffline) {
    Toast.show({
      type: 'info',
      text1: 'Offline',
      text2: 'No internet connection',
      position: 'top',
      visibilityTime: 3000,
    });
    return;
  }

  // ✅ Error check
  if (response?.error) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: response.message || 'Something went wrong',
      position: 'top',
      visibilityTime: 3000,
    });
    return;
  }

  if (response?.message === "success") {
    router.replace("/(tabs)/dashboard");
  }
};
  return (
    <ScrollView
      className="flex-1 bg-white px-6"
      contentContainerStyle={{ 
    paddingTop: insets.top + 24,
    paddingBottom: insets.bottom + 24,
  }}
      
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View className="items-center mb-4">
        <Image
          source={require("../../assets/images/armIT_logo.png")}
          className="w-[280px] h-[100px]"
          resizeMode="contain"
        />
      </View>

      {/* Header */}
      <View className="mb-8 items-center">
        <Text className="text-[22px] font-bold text-[#4A5568] mb-2 text-center">
          Thank you for your business!
        </Text>
        <Text className="text-[16px] text-[#718096] text-center">
          Let's create an account to continue.
        </Text>
      </View>

      {/* Inputs */}
      <View className="items-center mb-6">
        <View className="w-full max-w-[350px] gap-3">

          {/* First Name */}
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="First Name"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  inputClassName="h-12"
                  leftIcon={<Ionicons name="person-outline" size={20} color="gray" />}
                />
                {errors.firstName && (
                  <Text className="text-red-500 text-xs mt-1">{errors.firstName.message}</Text>
                )}
              </View>
            )}
          />

          {/* Last Name */}
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Last Name"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  inputClassName="h-12"
                  leftIcon={<Ionicons name="person-outline" size={20} color="gray" />}
                />
                {errors.lastName && (
                  <Text className="text-red-500 text-xs mt-1">{errors.lastName.message}</Text>
                )}
              </View>
            )}
          />

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Email"
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

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  showPasswordToggle
                  autoCapitalize="none"
                  inputClassName="h-12"
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color="gray" />}
                />
                {errors.password && (
                  <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>
                )}
              </View>
            )}
          />

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  showPasswordToggle
                  autoCapitalize="none"
                  inputClassName="h-12"
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color="gray" />}
                />
                {errors.confirmPassword && (
                  <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</Text>
                )}
              </View>
            )}
          />

        </View>
      </View>

      {/* Button */}
      <View className="items-center mb-12">
     <Pressable
         className="bg-white border-2 h-14 w-32 border-[#2B6CB0] rounded-lg justify-center items-center"
         onPress={handleSubmit(onSubmit)}
         disabled={isLoading}
       >
         {isLoading ? (
           <ActivityIndicator color="#2B6CB0" />
         ) : (
           <Text className="text-[#2B6CB0] text-[17px] font-bold tracking-widest text-center">
             DONE
           </Text>
         )}

       </Pressable>
       </View>

      {/* Terms */}
      <View className="px-4 mb-6">
        <Text className="text-[#718096] text-[14px] text-center leading-[20px]">
          By pressing{" "}
          <Text className="font-semibold text-[#4A5568]">DONE</Text> you accept
          our{" "}
          <Text className="text-[#2B6CB0] underline font-medium">
            Terms of Service
          </Text>
        </Text>
      </View>

      {/* Bottom Tagline */}
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