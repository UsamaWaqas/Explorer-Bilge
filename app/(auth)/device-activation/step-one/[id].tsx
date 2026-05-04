import GlobalInput from "@/components/Input";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import * as yup from "yup";
import { post } from "../../../../api/apiHelper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeviceActivationForm {
  activationCode: string;
  deviceName: string;
  deviceLocation: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const schema: yup.ObjectSchema<DeviceActivationForm> = yup.object({
  activationCode: yup.string().required("Activation code is required"),
  deviceName: yup.string().required("Device name is required"),
  deviceLocation: yup.string().required("Device location is required"),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepOne() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deviceImage, setDeviceImage] = useState<string | null>(null);
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  const { id } = useLocalSearchParams<{ id: string }>();
  console.log("Step one id:", id);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeviceActivationForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      activationCode: "",
      deviceName: "",
      deviceLocation: "",
    },
  });

  const handleActivationCodeBlur = async (activationCode: string) => {
    if (!activationCode) return;
    setIsFetchingImage(true);
    try {
      const response = await post(
        "/api/devices/showImage",
        { activationCode },
        {},
        false
      );
      if (response?.success === false) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Invalid activation code",
          position: "top",
          visibilityTime: 3000,
        });
        setDeviceImage(null);
      } else {
        const image = response?.message?.product?.image;
        setDeviceImage(image || null);
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      setDeviceImage(null);
    } finally {
      setIsFetchingImage(false);
    }
  };

  const onSubmit = async (data: DeviceActivationForm) => {
    setIsLoading(true);
    try {
      const imageResponse = await post(
        "/api/devices/showImage",
        { activationCode: data.activationCode },
        {},
        false
      );

      if (imageResponse?.success !== true) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please enter correct activation code",
          position: "top",
          visibilityTime: 3000,
        });
        setIsLoading(false);
        return;
      }

      const response = await post(
        "/api/devices/activate",
        { ...data, userId: id },
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

      if (response?.success === true) {
        const deviceId = response?.deviceId;
        Toast.show({
          type: "warning",
          text1: "Device Added",
          text2: "Activate by completing payment",
          position: "top",
          visibilityTime: 3000,
        });
        router.push({
          pathname: "/(auth)/device-activation/step-two/[id]",
          params: { id: deviceId, userId: id },
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response?.message || "Something went wrong",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ErrorText = ({ message }: { message?: string }) =>
    message ? (
      <Text className="text-red-500 text-xs mt-1 ml-1">{message}</Text>
    ) : null;

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
            <View className="h-2 bg-[#2B6CB0] rounded-full" style={{ width: "33.3%" }} />
          </View>
        </View>

        {/* Step Indicator */}
        <Text className="text-center text-[#4A5568] text-base mb-4">
          Step <Text className="text-[#2B6CB0] font-semibold">1</Text> of{" "}
          <Text className="text-[#2B6CB0] font-semibold">3</Text>
        </Text>

        {/* Device Image */}
        <View className="items-center mb-6">
          {isFetchingImage ? (
            <View className="w-[200px] h-[200px] justify-center items-center bg-gray-100 rounded-xl">
              <ActivityIndicator color="#2B6CB0" />
            </View>
          ) : deviceImage ? (
            <Image
              source={{ uri: deviceImage }}
              className="w-[200px] h-[200px] rounded-xl"
              resizeMode="contain"
            />
          ) : (
            <View className="w-[200px] h-[200px] bg-gray-100 rounded-xl justify-center items-center border border-gray-200">
              <Ionicons name="hardware-chip-outline" size={60} color="#CBD5E0" />
              <Text className="text-gray-400 text-xs mt-2">No device image</Text>
            </View>
          )}
        </View>

        {/* Form Fields */}
        <View className="gap-3">
          {/* Activation Code */}
          <Controller
            control={control}
            name="activationCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Activation Code"
                  value={value}
                  onChangeText={onChange}
                  inputClassName="h-12"
                  onBlur={() => {
                    onBlur();
                    handleActivationCodeBlur(value);
                  }}
                  leftIcon={
                    <Ionicons name="qr-code-outline" size={20} color="gray" />
                  }
                />
                <ErrorText message={errors.activationCode?.message} />
              </View>
            )}
          />

          {/* Device Name */}
          <Controller
            control={control}
            name="deviceName"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Device Name"
                  value={value}
                  onChangeText={onChange}
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="hardware-chip-outline" size={20} color="gray" />
                  }
                />
                <ErrorText message={errors.deviceName?.message} />
              </View>
            )}
          />

          {/* Device Location */}
          <Controller
            control={control}
            name="deviceLocation"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Device Location"
                  value={value}
                  onChangeText={onChange}
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="location-outline" size={20} color="gray" />
                  }
                />
                <ErrorText message={errors.deviceLocation?.message} />
              </View>
            )}
          />
        </View>

        {/* Next Button */}
        <View className="items-center mt-8 mb-6">
          <Pressable
            className="bg-white border-2 h-14 w-32 border-[#2B6CB0] rounded-lg justify-center items-center"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#2B6CB0" />
            ) : (
              <Text className="text-[#2B6CB0] text-[14px] font-bold tracking-widest">
                NEXT
              </Text>
            )}
          </Pressable>
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
