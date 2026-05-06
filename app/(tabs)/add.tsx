import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import { post } from "../../api/apiHelper";
import GlobalInput from "../../components/Input";
import { useAuthStore } from "../../store/authStore";
import ArmITLogo from "../../assets/images/armIT_logo.svg";

type DeviceForm = {
  activationCode: string;
  deviceName: string;
  deviceLocation: string;
  image: string;
  verified: boolean;
  productName: string;
  lastVerifiedCode: string;
};

type DeviceErrors = {
  activationCode?: string;
  deviceName?: string;
  deviceLocation?: string;
  image?: string;
};

const emptyDevice = (): DeviceForm => ({
  activationCode: "",
  deviceName: "",
  deviceLocation: "",
  image: "",
  verified: false,
  productName: "",
  lastVerifiedCode: "",
});

const AddDeviceScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [devices, setDevices] = useState<DeviceForm[]>([emptyDevice()]);
  const [errors, setErrors] = useState<DeviceErrors[]>([{}]);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateDevice = (index: number, patch: Partial<DeviceForm>) => {
    setDevices((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  };

  const clearError = (index: number, field: keyof DeviceErrors) => {
    setErrors((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: undefined } : e))
    );
  };

  const addDevice = () => {
    setDevices((prev) => [...prev, emptyDevice()]);
    setErrors((prev) => [...prev, {}]);
  };

  const removeDevice = (index: number) => {
    setDevices((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActivationCodeBlur = async (index: number) => {
    const value = devices[index].activationCode.trim();
    if (!value) return;

    const normalized = value.toLowerCase();
    const current = devices[index];

    if (current.verified && current.lastVerifiedCode === normalized) return;

    if (current.lastVerifiedCode !== normalized) {
      updateDevice(index, { verified: false, image: "", productName: "" });
    }

    const isDuplicate = devices.some(
      (d, i) => i !== index && d.activationCode.trim().toLowerCase() === normalized
    );
    if (isDuplicate) {
      Toast.show({ type: "error", text1: "Duplicate", text2: "This activation code is already added.", position: "top" });
      return;
    }

    try {
      setLoadingIndex(index);
      const response = await post("/api/devices/showImage", { activationCode: value }, {}, false);
      console.log("Image fetch response:", response);

      if (response?.success || response?.data?.product) {

        const product = response?.data?.product;
        updateDevice(index, {
          image: product?.image || "",
          productName: product?.product_name || "",
          verified: true,
          lastVerifiedCode: normalized,
        });
      } else {
        updateDevice(index, { image: "", productName: "", verified: false, lastVerifiedCode: normalized });
        Toast.show({ type: "error", text1: "Invalid Code", text2: `Could not verify: ${value}`, position: "top" });
      }
    } catch (error) {
      console.error("Image fetch error:", error);
    } finally {
      setLoadingIndex(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: DeviceErrors[] = devices.map((d) => {
      const e: DeviceErrors = {};
      if (!d.activationCode.trim()) e.activationCode = "Activation code required";
      if (!d.deviceName.trim()) e.deviceName = "Device name required";
      if (!d.deviceLocation.trim()) e.deviceLocation = "Device location required";
      if (!d.image) e.image = "Please verify activation code first";
      return e;
    });
    setErrors(newErrors);
    return newErrors.every((e) => Object.keys(e).length === 0);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!user?.euid) {
      Toast.show({ type: "error", text1: "Session expired", text2: "Please log in again", position: "top" });
      return;
    }

    try {
      setIsSubmitting(true);

      console.log("=== SUBMIT START ===");
      console.log("user.euid:", user?.euid);

      const response = await post(
        "/api/devices/activate",
        {
          userId: user?.euid,
          devices: devices.map((d) => ({
            activationCode: d.activationCode,
            deviceName: d.deviceName,
            deviceLocation: d.deviceLocation,
          })),
        },
        {},
        false
      );

      console.log("Activate API response:", JSON.stringify(response, null, 2));

      if (!response || response?.error) {
        Toast.show({ type: "error", text1: "Error", text2: response?.message || "Failed to activate devices", position: "top" });
        return;
      }

      const results: Array<{ success: boolean; deviceId?: number; activationCode: string; message: string }> =
        response?.results ?? [];

      console.log("Results array:", JSON.stringify(results, null, 2));

      const failed = results.filter((r) => !r.success);

      if (failed.length > 0) {
        Toast.show({
          type: "error",
          text1: "Some devices failed",
          text2: failed.map((f) => `${f.activationCode}: ${f.message}`).join("\n"),
          position: "top",
          visibilityTime: 6000,
        });
        return;
      }

     const deviceIds = results
  .filter((r) => r.success && r.deviceId)
  .map((r) => String(r.deviceId))

      console.log("deviceIds to pass:", deviceIds);
      console.log("euid to pass:", user?.euid);

      Toast.show({
        type: "success",
        text1: "Devices Activated",
        text2: "Proceeding to plan selection…",
        position: "top",
        visibilityTime: 2000,
      });

      router.push({
        pathname: "/(tabs)/device-events/add-device/step-two/[id]" as any,
        params: {
          id: JSON.stringify(deviceIds),
          euid: user?.euid,
        },
      });
    } catch (error: any) {
      console.error("Activation error:", error);
      Toast.show({ type: "error", text1: "Error", text2: "Something went wrong", position: "top" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 bg-white px-5">

          {/* Logo */}
          <View className="items-center mb-6 mt-4">
              <ArmITLogo width={240} height={100} />
            {/* <Image source={require("../../assets/images/armIT_logo.png")} className="w-[260px] h-[90px]" resizeMode="contain" /> */}
          </View>

          {/* Heading */}
          <View className="mb-4">
            <Text className="text-[26px] font-bold text-[#4A5568] mb-2">Add Device</Text>
            <Text className="text-[15px] text-[#718096] leading-[22px]">
              Enter activation codes, verify each device, then continue to plan selection.
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="mb-6">
            <View className="h-2 bg-[#EDF2F7] rounded-full overflow-hidden">
              <View className="h-full bg-[#2B6CB0] rounded-full w-1/3" />
            </View>
            <Text className="text-[#718096] text-[13px] mt-1">Step 1 of 3 — Verify Devices</Text>
          </View>

          {/* Device Cards */}
          {devices.map((device, index) => (
            <View key={index} className="border border-gray-200 rounded-2xl mb-4 overflow-hidden">

              {/* Card Header */}
              <View className="bg-gray-50 px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
                <View>
                  <Text className="font-bold text-[#4A5568] text-base">Device #{index + 1}</Text>
                  <Text className="text-[#718096] text-xs mt-0.5">Enter code, name & location</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {device.verified && (
                    <View className="flex-row items-center bg-green-50 border border-green-100 rounded-full px-3 py-1">
                      <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                      <Text className="text-green-700 text-xs font-semibold ml-1">Verified</Text>
                    </View>
                  )}
                  {devices.length > 1 && (
                    <Pressable onPress={() => removeDevice(index)} className="w-8 h-8 rounded-lg border border-red-200 items-center justify-center">
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Card Body */}
              <View className="p-4">
                {/* Image Preview */}
                <View className="items-center mb-4">
                  {loadingIndex === index ? (
                    <View className="w-32 h-28 items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                      <ActivityIndicator size="large" color="#2B6CB0" />
                      <Text className="text-[#718096] text-xs mt-2">Verifying…</Text>
                    </View>
                  ) : device.image ? (
                    <View className="items-center">
                      <Image source={{ uri: device.image }} className="w-32 h-28 rounded-xl" resizeMode="contain" />
                      {device.productName ? (
                        <Text className="text-[#4A5568] font-semibold text-sm mt-2 text-center">{device.productName}</Text>
                      ) : null}
                      <Text className="text-green-600 text-xs mt-0.5">Eligible for activation</Text>
                    </View>
                  ) : (
                    <View className="w-32 h-28 bg-[#F7FAFC] rounded-xl items-center justify-center border-2 border-[#CBD5E0]">
                      <Ionicons name="image-outline" size={36} color="#CBD5E0" />
                      <Text className="text-[#A0AEC0] text-[11px] font-bold tracking-widest uppercase mt-1">NO IMAGE</Text>
                      <Text className="text-[#A0AEC0] text-[10px] text-center px-2 mt-1">Verify code to preview</Text>
                    </View>
                  )}
                </View>

                {/* Form Fields */}
                <View className="gap-y-3">
                  <GlobalInput
                    placeholder="Activation Code"
                    value={device.activationCode}
                    onChangeText={(val: string) => { updateDevice(index, { activationCode: val }); clearError(index, "activationCode"); }}
                    onBlur={() => handleActivationCodeBlur(index)}
                    autoCapitalize="characters"
                    returnKeyType="next"
                    error={errors[index]?.activationCode || errors[index]?.image}
                    inputClassName="h-12"
                    leftIcon={<Ionicons name="key-outline" size={20} color="gray" />}
                  />
                  <GlobalInput
                    placeholder="Device Name"
                    value={device.deviceName}
                    onChangeText={(val: string) => { updateDevice(index, { deviceName: val }); clearError(index, "deviceName"); }}
                    returnKeyType="next"
                    inputClassName="h-12"
                    error={errors[index]?.deviceName}
                    leftIcon={<Ionicons name="hardware-chip-outline" size={20} color="gray" />}
                  />
                  <GlobalInput
                    placeholder="Device Location"
                    value={device.deviceLocation}
                    onChangeText={(val: string) => { updateDevice(index, { deviceLocation: val }); clearError(index, "deviceLocation"); }}
                    returnKeyType="done"
                    inputClassName="h-12"
                    error={errors[index]?.deviceLocation}
                    leftIcon={<Ionicons name="location-outline" size={20} color="gray" />}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Add Another Device */}
          <TouchableOpacity
            onPress={addDevice}
            className="flex-row items-center justify-center border border-dashed border-[#2B6CB0] rounded-xl py-3 mb-6"
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color="#2B6CB0" />
            <Text className="text-[#2B6CB0] font-semibold ml-2">Add Another Device</Text>
          </TouchableOpacity>

          {/* Footer / Submit */}
          <View className="border border-gray-200 rounded-xl p-4 mb-6 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="font-semibold text-[#4A5568]">Ready for next step?</Text>
              <Text className="text-[#718096] text-xs mt-0.5">Verified devices will continue to plan selection.</Text>
            </View>
            <TouchableOpacity
              className="bg-white border-2 border-[#2B6CB0] rounded-lg py-3 px-6"
              onPress={handleSubmit}
              disabled={isSubmitting || loadingIndex !== null}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#2B6CB0" />
              ) : (
                <Text className="text-[#2B6CB0] text-[15px] font-bold tracking-widest">CONTINUE</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Tagline */}
          <View className="items-center mb-6 mt-2">
            <Text className="text-[#2B6CB0] text-[16px] font-bold tracking-wide">THE SMART WAY TO MONITOR</Text>
            <Text className="text-[#CBD5E0] text-[14px] font-semibold tracking-wide mt-1">EVERYTHING THAT MATTERS</Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddDeviceScreen;