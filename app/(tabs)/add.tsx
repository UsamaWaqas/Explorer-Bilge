import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import GlobalInput from "../../components/Input";
import { post } from "../../api/apiHelper"; 
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

type FormData = {
  activationCode: string;
  deviceName: string;
  deviceLocation: string;
};

type FieldKey = keyof FormData;

const DeviceActivationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const userId = route?.params?.userId;

  const [formData, setFormData] = useState<FormData>({
    activationCode: "",
    deviceName: "",
    deviceLocation: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deviceImage, setDeviceImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const deviceNameRef = useRef<TextInput>(null);
  const deviceLocationRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.activationCode.trim())
      newErrors.activationCode = "Activation code required";
    if (!formData.deviceName.trim())
      newErrors.deviceName = "Device name required";
    if (!formData.deviceLocation.trim())
      newErrors.deviceLocation = "Device location required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleActivationCodeBlur = async () => {
    if (!formData.activationCode.trim()) return;
    try {
      setIsImageLoading(true);
      const response = await post(
        "/api/devices/showImage",
        { activationCode: formData.activationCode },
        {},
        false 
      );
      if (response?.success) {
        setDeviceImage(response?.message?.product?.image || "");
      } else {
        setDeviceImage("");
      }
    } catch (error) {
      console.error("Image fetch error:", error);
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleNext = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);

     
      const imageResponse = await post(
        "/api/devices/showImage",
        { activationCode: formData.activationCode },
        {},
        false 
      );

      if (!imageResponse?.success) {
        
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please enter correct activation code",
          position: "top",
        });
        return;
      }

      
      const activateResponse = await post(
        "/api/devices/activate",
        { ...formData, userId },
        {},
        false
      );

      if (activateResponse?.success) {
        const deviceId = activateResponse?.deviceId;
        Toast.show({
          type: "success", 
          text1: "Success",
          text2: "Device added — activate by completing payment.",
          position: "top",
        });
        navigation.navigate("DeviceActivationStepTwo", { userId, deviceId });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: activateResponse?.message || "Activation failed",
          position: "top",
        });
      }
    } catch (error: any) {
      console.error("Activation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: FieldKey, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 bg-white px-6">
         
          <View className="items-center mb-8 mt-4">
            <Image
              source={require("../../assets/images/armIT_logo.png")}
              className="w-[280px] h-[100px]"
              resizeMode="contain"
            />
          </View>

         
          <View className="mb-4">
            <Text className="text-[28px] font-bold text-[#4A5568] mb-3">
              Device Activation
            </Text>
            <Text className="text-[16px] text-[#718096] leading-[24px]">
              Enter your device details to activate and continue.
            </Text>
          </View>

         
          <View className="mb-8">
            <View className="h-2 bg-[#EDF2F7] rounded-full overflow-hidden">
              <View className="h-full bg-[#2B6CB0] rounded-full w-1/3" />
            </View>
            <Text className="text-[#718096] text-[14px] mt-2">Step 1 of 3</Text>
          </View>

         
          <View className="items-center mb-8">
            {isImageLoading ? (
              <View className="w-40 h-36 items-center justify-center">
                <ActivityIndicator size="large" color="#2B6CB0" />
              </View>
            ) : deviceImage ? (
              <Image
                source={{ uri: deviceImage }}
                className="w-40 h-36 rounded-xl"
                resizeMode="contain"
              />
            ) : (
             
              <View className="w-40 h-36 bg-[#F7FAFC] rounded-xl items-center justify-center border-2 border-[#CBD5E0]">
                <Ionicons name="image-outline" size={40} color="#CBD5E0" />
                <Text className="text-[#A0AEC0] text-[13px] font-bold tracking-widest uppercase mt-2">
                  NO IMAGE
                </Text>
                <Text className="text-[#A0AEC0] text-[13px] font-bold tracking-widest uppercase">
                  FOUND
                </Text>
              </View>
            )}
          </View>

          {/* Form */}
          <View className="mb-6  flex-col gap-y-4">
            <GlobalInput
              placeholder="Activation Code"
              value={formData.activationCode}
              onChangeText={(val: string) => handleChange("activationCode", val)}
              onBlur={handleActivationCodeBlur} // image fetch on blur
              returnKeyType="next"
              onSubmitEditing={() => deviceNameRef.current?.focus()}
              autoCapitalize="characters"
              error={errors.activationCode}
              inputClassName="h-12"
              leftIcon={<Ionicons name="key-outline" size={20} color="gray" />}
            />

            <GlobalInput
              placeholder="Device Name"
              value={formData.deviceName}
              onChangeText={(val: string) => handleChange("deviceName", val)}
              returnKeyType="next"
              inputClassName="h-12"
              onSubmitEditing={() => deviceLocationRef.current?.focus()}
              error={errors.deviceName}
              leftIcon={<Ionicons name="hardware-chip-outline" size={20} color="gray" />}
            />

            <GlobalInput
              placeholder="Device Location"
              value={formData.deviceLocation}
              onChangeText={(val: string) => handleChange("deviceLocation", val)}
              returnKeyType="done"
              inputClassName="h-12"
              onSubmitEditing={handleNext}
              error={errors.deviceLocation}
              leftIcon={<Ionicons name="location-outline" size={20} color="gray" />}
            />
          </View>

          {/* Next Button */}
          <View className="items-center mb-12">
            <TouchableOpacity
              className="bg-white border-2 border-[#2B6CB0] rounded-lg py-3 px-12"
              onPress={handleNext}
              disabled={isLoading}
              
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#2B6CB0" />
              ) : (
                <Text className="text-[#2B6CB0] text-[17px] font-bold tracking-widest">
                  NEXT
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Tagline */}
          <View className="items-center mb-8 mt-auto">
            <Text className="text-[#2B6CB0] text-[18px] font-bold tracking-wide">
              THE SMART WAY TO MONITOR
            </Text>
            <Text className="text-[#CBD5E0] text-[16px] font-semibold tracking-wide mt-1">
              EVERYTHING THAT MATTERS
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DeviceActivationScreen;