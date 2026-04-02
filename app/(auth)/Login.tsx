import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalInput from "../../components/Input";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { loginService } from "../../services/authService";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

export default function Login() {
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
  const result = await loginService(data.email, data.password);
  setIsLoading(false);


  if (result?.isOffline) {
    Toast.show({
      type: 'info',
      text1: 'Offline',
      text2: 'No internet connection',
      position: 'top',
      visibilityTime: 3000,
    });
    return;
  }

 
  if (!result.success) {
    Toast.show({
      type: 'error',
      text1: 'Login Failed',
      text2: result.message || 'Invalid credentials',
      position: 'top',
      visibilityTime: 3000,
    });
    return;
  }

  router.replace("/(tabs)/dashboard");
};

  return (
    <ScrollView
      className="flex-1 bg-white px-6"
      contentContainerStyle={{ paddingTop: insets.top + 24 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Logo Section */}
      <View className="items-center mb-12 mt-8">
        <Image
          source={require("../../assets/images/armIT_logo.png")}
          className="w-[280px] h-[100px]"
          resizeMode="contain"
        />
      </View>

      {/* Welcome Text */}
      <View className="mb-8 flex justify-center items-center">
        <Text className="text-[28px] font-bold text-[#4A5568] mb-3 text-center">
          Welcome to myARMIT!
        </Text>
        <Text className="text-[16px] text-[#718096] leading-[24px] text-center">
          Please enter your email address and password to continue.
        </Text>
      </View>

      {/* Input Fields */}
      <View className="mb-6">
        <View className="flex gap-3">
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
                  inputClassName="h-12"
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color="gray" />}
                />
                {errors.password && (
                  <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>
                )}
              </View>
            )}
          />
        </View>

        {/* Forgot Password */}
        <Pressable
          className="self-end mt-1"
          onPress={() => router.push("/(auth)/ForgetPassword")}
        >
          <Text className="text-[#E53E3E] text-[15px] font-medium">
            Forgot Password?
          </Text>
        </Pressable>
      </View>

      {/* Create Account */}
      <View className="mb-10 text-center">
        <Text className="text-[15px] text-[#4A5568] leading-[22px] text-center">
          New to <Text className="font-semibold">myARMIT?</Text> Just click the
          link below to{"\n"}create a new account.
          <Text
            className="text-[#2B6CB0] text-[16px] font-semibold"
            onPress={() => router.push("/(auth)/Register")}
          >
            {" "}Create Account
          </Text>
        </Text>
      </View>

      {/* Next Button — ✅ isLoading se control */}
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
        NEXT
      </Text>
    )}
  </Pressable>
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