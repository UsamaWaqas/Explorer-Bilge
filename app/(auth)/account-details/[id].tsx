import GlobalInput from "@/components/Input";
import CustomDropdown from "@/components/Select";
import { countries, phoneTypes, states } from "@/data/Data";
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
import { post } from "../../../api/apiHelper";

interface AccountDetailsForm {
  phoneNumber: string;
  phoneType: string;
  notificationNumber: string;
  notificationEmail: string;
  firstAddress: string;
  secondAddress: string;
  city: string;
  zipCode: string;
  country: string;
  state: string;
  termsAccepted: boolean;
}

const schema: yup.ObjectSchema<AccountDetailsForm> = yup.object({
  phoneNumber: yup
    .string()
    .required("Phone Number is required")
    .matches(/^\d{10,}$/, "Phone Number must be at least 10 digits"),
  phoneType: yup.string().required("Phone Type is required"),
  notificationNumber: yup
    .string()
    .required("Notification Phone Number is required"),
  notificationEmail: yup
    .string()
    .required("Notification email address is required"),
  firstAddress: yup.string().required("Address one is required"),
  secondAddress: yup.string().default(""),
  city: yup.string().required("City is required"),
  zipCode: yup.string().required("Zip Code / Postal Code is required"),
  country: yup.string().required("Country is required"),
  state: yup.string().required("State / Region is required"),
  termsAccepted: yup
    .boolean()
    .oneOf([true], "You must accept the terms")
    .required()
    .default(false),
});

export default function AccountDetails() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountDetailsForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      phoneNumber: "",
      phoneType: "",
      notificationNumber: "",
      notificationEmail: "",
      firstAddress: "",
      secondAddress: "",
      city: "",
      zipCode: "",
      country: "",
      state: "",
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: AccountDetailsForm) => {
    setIsLoading(true);

    const payload = {
      ...data,
      userId: id,
    };

    const response = await post("/api/users/detail", payload, {}, true);
    setIsLoading(false);

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
        text1: "User detail submission failed",
        text2: response.message || "Try Again",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (response?.success === true) {
      Toast.show({
        type: "success",
        text1: "Users Details Submitted",
        position: "top",
        visibilityTime: 3000,
      });

      console.log("Redirecting with id:", id);

      router.replace({
        pathname: "/(auth)/device-activation/step-one/[id]",
        params: { id: id },
      } as any);
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
            source={require("../../../assets/images/armIT_logo.png")}
            className="w-[280px] h-[100px]"
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-[22px] font-bold text-[#4A5568]">
            Account Details
          </Text>
        </View>

        <View className="gap-3">
          {/* Phone Number */}
          <View>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, value } }) => (
                <GlobalInput
                  placeholder="Phone Number"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="call-outline" size={20} color="gray" />
                  }
                />
              )}
            />
            <ErrorText message={errors.phoneNumber?.message} />
          </View>

          {/* Phone Type */}
          <View>
            <Controller
              control={control}
              name="phoneType"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  data={phoneTypes}
                  value={value}
                  onChange={(val) => onChange(String(val))}
                  placeholder="Phone Type"
                  label="Phone Type"
                />
              )}
            />
            <ErrorText message={errors.phoneType?.message} />
          </View>

          {/* Notification Number */}
          <Controller
            control={control}
            name="notificationNumber"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Notification Number"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color="gray"
                    />
                  }
                />
                <ErrorText message={errors.notificationNumber?.message} />
              </View>
            )}
          />

          {/* Notification Email */}
          <Controller
            control={control}
            name="notificationEmail"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Notification Email Address"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="mail-outline" size={20} color="gray" />
                  }
                />
                <ErrorText message={errors.notificationEmail?.message} />
              </View>
            )}
          />

          {/* First Address */}
          <Controller
            control={control}
            name="firstAddress"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="First Address"
                  value={value}
                  onChangeText={onChange}
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="location-outline" size={20} color="gray" />
                  }
                />
                <ErrorText message={errors.firstAddress?.message} />
              </View>
            )}
          />

          {/* Second Address */}
          <Controller
            control={control}
            name="secondAddress"
            render={({ field: { onChange, value } }) => (
              <GlobalInput
                placeholder="Second Address (optional)"
                value={value}
                onChangeText={onChange}
                inputClassName="h-12"
                leftIcon={
                  <Ionicons name="location-outline" size={20} color="gray" />
                }
              />
            )}
          />

          {/* City */}
          <View>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value } }) => (
                <GlobalInput
                  placeholder="City"
                  value={value}
                  onChangeText={onChange}
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="business-outline" size={20} color="gray" />
                  }
                />
              )}
            />
            <ErrorText message={errors.city?.message} />
          </View>

          {/* Zip Code */}
          <View>
            <Controller
              control={control}
              name="zipCode"
              render={({ field: { onChange, value } }) => (
                <GlobalInput
                  placeholder="Zip Code / Postal Code"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="map-outline" size={20} color="gray" />
                  }
                />
              )}
            />
            <ErrorText message={errors.zipCode?.message} />
          </View>

          {/* Country */}
          <View>
            <Controller
              control={control}
              name="country"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  data={countries}
                  value={value}
                  onChange={(val) => onChange(String(val))}
                  placeholder="Country"
                  label="Country"
                />
              )}
            />
            <ErrorText message={errors.country?.message} />
          </View>

          {/* State */}
          <View>
            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  data={states}
                  value={value}
                  onChange={(val) => onChange(String(val))}
                  placeholder="State / Region"
                  label="State / Region"
                />
              )}
            />
            <ErrorText message={errors.state?.message} />
          </View>

          {/* Terms Checkbox */}
          <Controller
            control={control}
            name="termsAccepted"
            render={({ field: { onChange, value } }) => (
              <View>
                <Pressable
                  className="flex-row items-center gap-3"
                  onPress={() => onChange(!value)}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 justify-center items-center ${
                      value
                        ? "bg-[#2B6CB0] border-[#2B6CB0]"
                        : "border-gray-400"
                    }`}
                  >
                    {value && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text className="text-[#718096] flex-1">
                    I have read and agree to the{" "}
                    <Text className="font-semibold text-[#2B6CB0]">
                      Terms & Conditions
                    </Text>
                  </Text>
                </Pressable>
                <ErrorText message={errors.termsAccepted?.message} />
              </View>
            )}
          />
        </View>

        {/* Submit Button */}
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
                REGISTER
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
