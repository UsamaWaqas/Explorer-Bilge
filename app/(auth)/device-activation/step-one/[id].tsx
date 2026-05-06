import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import ArmITLogo from "../../../../assets/images/armIT_logo.svg";

import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { post } from "../../../../api/apiHelper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Device {
  activationCode: string;
  deviceName: string;
  deviceLocation: string;
  image: string;
  verified: boolean;
  productName: string;
  lastVerifiedCode: string; 
}

interface DeviceActivationForm {
  devices: Device[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepOne() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = id;

  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, setValue, getValues } =
    useForm<DeviceActivationForm>({
      defaultValues: {
        devices: [
          {
            activationCode: "",
            deviceName: "",
            deviceLocation: "",
            image: "",
            verified: false,
            productName: "",
            lastVerifiedCode: "", 
          },
        ],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "devices",
  });

  // ─── Device Lookup (on blur of activation code) ──────────────────────────

  const deviceLookup = async (value: string, index: number) => {
    if (!value?.trim()) return;

    const normalizedValue = value.trim().toLowerCase();
    const currentDevice = getValues(`devices.${index}`);

  
    if (currentDevice.verified && currentDevice.lastVerifiedCode === normalizedValue) {
      return;
    }

    if (currentDevice.lastVerifiedCode !== normalizedValue) {
      setValue(`devices.${index}.verified`, false);
      setValue(`devices.${index}.image`, "");
      setValue(`devices.${index}.productName`, "");
    }


    const allDevices = getValues("devices");
    const isDuplicate = allDevices.some(
      (d, i) =>
        i !== index &&
        d.activationCode?.trim().toLowerCase() === normalizedValue
    );
    if (isDuplicate) {
      Toast.show({
        type: "error",
        text1: "Duplicate Code",
        text2: "This activation code is already added.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    setLoadingIndex(index);
    try {
      const response = await post(
        "/api/devices/showImage",
        { activationCode: value.trim() },
        {},
        true
      );
         console.log("Image fetch response:", response);

  
      // if (response?.isOffline) {
      //   Toast.show({
      //     type: "info",
      //     text1: "Offline",
      //     text2: "No internet connection",
      //     position: "top",
      //     visibilityTime: 3000,
      //   });
      //   return;
      // }

      // if (response?.success === false) {
      //   Toast.show({
      //     type: "error",
      //     text1: "Error",
      //     text2: `Invalid activation code: ${value}`,
      //     position: "top",
      //     visibilityTime: 3000,
      //   });
      //   return;
      // }

      setValue(`devices.${index}.image`, response?.data?.product?.image ?? "");
      setValue(`devices.${index}.productName`, response?.data?.product?.product_name ?? "");
      setValue(`devices.${index}.verified`, true);
      
      setValue(`devices.${index}.lastVerifiedCode`, normalizedValue);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to verify activation code",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingIndex(null);
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = async (data: DeviceActivationForm) => {
    const allValid = data.devices.every((d) => d.image && d.image !== "");
    if (!allValid) {
      Toast.show({
        type: "error",
        text1: "Verify all devices",
        text2: "Please verify all activation codes first.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await post(
        "/api/devices/activate",
        { userId, devices: data.devices },
        {},
        false
      );

    
      if (response?.isOffline) {
        Toast.show({ type: "info", text1: "Offline", text2: "No internet connection", position: "top", visibilityTime: 3000 });
        return;
      }

      const failedDevices = response?.results?.filter((d: any) => !d.success) ?? [];

      if (failedDevices.length > 0) {
        const msg = response.results
          .map((d: any) => `${d.activationCode}: ${d.message}`)
          .join("\n");
        Toast.show({ type: "error", text1: "Activation Failed", text2: msg, position: "top", visibilityTime: 10000 });
        return;
      }

      Toast.show({ type: "success", text1: "Devices Verified!", text2: "Proceeding to plan selection.", position: "top", visibilityTime: 3000 });

      const deviceIds = response?.results?.map((d: any) => d.deviceId);
      router.push({
        pathname: "/(auth)/device-activation/step-two/[id]",
        params: {
          id: userId,
          deviceIds: JSON.stringify(deviceIds),
          userId,
        },
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to activate devices", position: "top", visibilityTime: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View className="items-center pt-4 pb-2 px-6">
       <ArmITLogo width={240} height={100} />
      </View>

      {/* Head Card */}
      <View className="mx-4 mb-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Progress Bar */}
        <View className="h-1.5 bg-gray-200">
          <View className="h-1.5 bg-[#2B6CB0]" style={{ width: "33.3%" }} />
        </View>

        <View className="px-5 py-4 flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] text-[#2B6CB0] font-semibold uppercase tracking-widest mb-1">
              Step 1 of 3
            </Text>
            <Text className="text-lg font-bold text-[#374151] mb-1">
              Device Activation
            </Text>
            <Text className="text-xs font-semibold text-[#6B7280] mb-1">
              Verify Devices
            </Text>
            <Text className="text-xs text-[#9CA3AF] leading-4">
              Enter one or more activation codes. Verify each device before continuing to plan selection and billing.
            </Text>
          </View>

          {/* Bundle summary */}
          <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[80px] items-center">
            <Text className="text-[10px] text-[#9CA3AF] font-medium mb-0.5">Bundle Summary</Text>
            <Text className="text-sm font-bold text-[#374151]">{fields.length} Device(s)</Text>
          </View>
        </View>
      </View>

      {/* Device Cards */}
      <View className="px-4 gap-4">
        {fields.map((field, index) => {
          const device = getValues(`devices.${index}`);
          return (
            <View
              key={field.id}
              className="bg-white  rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <View className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between">
                <View>
                  <Text className="font-bold text-[#6B7280] text-base">
                    Device #{index + 1}
                  </Text>
                  <Text className="text-xs text-[#9CA3AF]">
                    Add activation code, name, and location
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  {device.verified && (
                    <View className="flex-row items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                      <Ionicons name="checkmark-circle" size={13} color="#059669" />
                      <Text className="text-emerald-600 text-xs font-semibold">Verified</Text>
                    </View>
                  )}
                  {fields.length > 1 && (
                    <Pressable
                      onPress={() => remove(index)}
                      className="w-8 h-8 rounded-lg border border-red-200 items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Card Body */}
              <View className="p-4 gap-3">
                {/* Activation Code */}
                <View>
                  <Text className="text-xs font-medium text-[#6B7280] mb-1.5">Activation Code</Text>
                  <Controller
                    control={control}
                    name={`devices.${index}.activationCode`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="flex-row items-center border border-slate-300 rounded-xl bg-white h-11 px-3 gap-2">
                        <Ionicons name="key-outline" size={16} color="#9CA3AF" />
                        <TextInput
                          className="flex-1 text-[#374151] text-sm"
                          placeholder="Enter Activation Code"
                          placeholderTextColor="#9CA3AF"
                          value={value}
                          onChangeText={onChange}
                          onBlur={() => {
                            onBlur();
                            deviceLookup(value, index);
                          }}
                        />
                        {loadingIndex === index && (
                          <ActivityIndicator size="small" color="#2B6CB0" />
                        )}
                      </View>
                    )}
                  />
                </View>

                {/* Device Name */}
                <View>
                  <Text className="text-xs font-medium text-[#6B7280] mb-1.5">Device Name</Text>
                  <Controller
                    control={control}
                    name={`devices.${index}.deviceName`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="flex-row items-center border border-slate-300 rounded-xl bg-white h-11 px-3 gap-2">
                        <Ionicons name="hardware-chip-outline" size={16} color="#9CA3AF" />
                        <TextInput
                          className="flex-1 text-[#374151] text-sm"
                          placeholder="e.g. Front Deck Sensor"
                          placeholderTextColor="#9CA3AF"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      </View>
                    )}
                  />
                </View>

                {/* Device Location */}
                <View>
                  <Text className="text-xs font-medium text-[#6B7280] mb-1.5">Device Location</Text>
                  <Controller
                    control={control}
                    name={`devices.${index}.deviceLocation`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="flex-row items-center border border-slate-300 rounded-xl bg-white h-11 px-3 gap-2">
                        <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                        <TextInput
                          className="flex-1 text-[#374151] text-sm"
                          placeholder="e.g. Marina Bay / Engine Room"
                          placeholderTextColor="#9CA3AF"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      </View>
                    )}
                  />
                </View>

                {/* Device Preview */}
                <View className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Text className="text-xs font-semibold text-[#6B7280] mb-2">Device Preview</Text>

                  <View className="rounded-xl overflow-hidden bg-white border border-slate-200 h-[160px] items-center justify-center">
                    {device.image ? (
                      <Image
                        source={{ uri: device.image }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View className="items-center">
                        <Ionicons name="hardware-chip-outline" size={48} color="#CBD5E0" />
                        <Text className="text-xs text-[#9CA3AF] mt-1">No image</Text>
                      </View>
                    )}
                  </View>

                  <View className="mt-2">
                    {loadingIndex === index ? (
                      <Text className="text-xs text-[#2B6CB0] font-medium">Verifying device...</Text>
                    ) : device.verified ? (
                      <>
                        <Text className="font-semibold text-[#374151] text-sm">{device.productName}</Text>
                        <Text className="text-xs text-emerald-600 mt-0.5">Eligible for activation</Text>
                      </>
                    ) : (
                      <Text className="text-xs text-[#9CA3AF]">
                        Image and product details will appear after verification.
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Add Another Device */}
      <View className="px-4 mt-4">
        <Pressable
          onPress={() =>
            append({
              activationCode: "",
              deviceName: "",
              deviceLocation: "",
              image: "",
              verified: false,
              productName: "",
              lastVerifiedCode: "",
            })
          }
          className="flex-row items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#2B6CB0] self-start"
        >
          <Ionicons name="add" size={18} color="#2B6CB0" />
          <Text className="text-[#2B6CB0] font-semibold text-sm">Add Another Device</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View className="mx-4 mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="font-semibold text-[#6B7280] text-sm">Ready for next step?</Text>
          <Text className="text-xs text-[#9CA3AF] mt-0.5">Verified devices will continue to plan selection.</Text>
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading || loadingIndex !== null}
          className="bg-white border border-[#6B7280] h-10 w-28 rounded-lg items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#2B6CB0" />
          ) : (
            <Text className="text-[#2B6CB0] font-bold text-sm">Continue</Text>
          )}
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