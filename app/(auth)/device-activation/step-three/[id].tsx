import React from "react";
import CustomDropdown from "../../../../components/Select";
import { states, countries } from "../../../../data/Data";
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
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import * as yup from "yup";
import { post } from "../../../../api/apiHelper";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormValues = {
  firstName: string;
  lastName: string;
  cardNumber: string;
  CVCCode: string;
  expirationMonth: string;
  expirationYear: string;
  AddressOne: string;
  AddressTwo: string;
  city: string;
  zipCode: string;
  country: string;
  state: string;
};

// ─── Month / Year options ─────────────────────────────────────────────────────

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = String(i + 1).padStart(2, "0");
  return { label: m, value: m };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => {
  const y = String(currentYear + i);
  return { label: y, value: y };
});

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  cardNumber: yup
    .string()
    .required("Card number is required")
    .matches(/^\d{13,19}$/, "Invalid card number"),
  CVCCode: yup
    .string()
    .required("CVC is required")
    .matches(/^\d{3,4}$/, "Invalid CVC"),
  expirationMonth: yup.string().required("Month is required"),
  expirationYear: yup.string().required("Year is required"),
  AddressOne: yup.string().required("Billing address is required"),
  AddressTwo: yup.string().default(""),
  city: yup.string().required("City is required"),
  zipCode: yup
    .string()
    .required("Zip code is required")
    .matches(/^\d{5}(-\d{4})?$/, "Invalid zip code"),
  country: yup.string().required("Country is required"),
  state: yup.string().required("State is required"),
});

// ─── Shared field label ───────────────────────────────────────────────────────

const FieldLabel = ({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) => (
  <Text className="text-[#4A5568] text-[13px] mb-1 font-medium">
    {label}
    {required && <Text className="text-red-500"> *</Text>}
  </Text>
);

const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <Text className="text-red-500 text-xs mt-1 ml-1">{message}</Text>
  ) : null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepThree() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { id: userId, deviceId } = useLocalSearchParams<{
    id: string;
    deviceId: string;
  }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      cardNumber: "",
      CVCCode: "",
      expirationMonth: "",
      expirationYear: "",
      AddressOne: "",
      AddressTwo: "",
      city: "",
      zipCode: "",
      country: "",
      state: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        expirationDate: `${values.expirationMonth}/${values.expirationYear}`,
        userId,
        deviceId,
      };
      const response = await post("/api/process-payment", payload, {}, false);

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

      Toast.show({
        type: "success",
        text1: "Payment Successful!",
        position: "top",
        visibilityTime: 3000,
      });

      router.replace("/(auth)/Login");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Payment Error",
        text2: "Failed to process payment. Please try again later.",
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
            <View className="h-2 bg-[#2B6CB0] rounded-full" style={{ width: "100%" }} />
          </View>
        </View>

        {/* Step Indicator */}
        <Text className="text-center text-[#4A5568] text-base mb-4">
          Step <Text className="text-[#2B6CB0] font-semibold">3</Text> of{" "}
          <Text className="text-[#2B6CB0] font-semibold">3</Text>
        </Text>

        {/* Plan summary */}
        <View className="items-center mb-6">
          <Text className="text-base text-center text-[#4A5568]">
            You selected myARMIT{"\n"}Unlimited 12 Months
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">

          {/* Card holder name */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel label="Card holder first name" required />
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-gray-100 rounded-lg px-3 h-12 text-[#4A5568] border border-gray-200"
                    placeholderTextColor="#9ca3af"
                    placeholder="First name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              <ErrorText message={errors.firstName?.message} />
            </View>

            <View className="flex-1">
              <FieldLabel label="Last name" required />
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-gray-100 rounded-lg px-3 h-12 text-[#4A5568] border border-gray-200"
                    placeholderTextColor="#9ca3af"
                    placeholder="Last name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              <ErrorText message={errors.lastName?.message} />
            </View>
          </View>

          {/* Card number + CVC */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel label="Card Number" required />
              <Controller
                control={control}
                name="cardNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-gray-100 rounded-lg px-3 h-12 text-[#4A5568] border border-gray-200"
                    placeholderTextColor="#9ca3af"
                    placeholder="Card number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                )}
              />
              <ErrorText message={errors.cardNumber?.message} />
            </View>

            <View className="flex-1">
              <FieldLabel label="CVC Code" required />
              <Controller
                control={control}
                name="CVCCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-gray-100 rounded-lg px-3 h-12 text-[#4A5568] border border-gray-200"
                    placeholderTextColor="#9ca3af"
                    placeholder="CVC"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                )}
              />
              <ErrorText message={errors.CVCCode?.message} />
            </View>
          </View>

          {/* Expiration date */}
          <View>
            <FieldLabel label="Expiration Date" required />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="expirationMonth"
                  render={({ field: { onChange, value } }) => (
                    <CustomDropdown
                      data={MONTHS}
                      value={value}
                      onChange={(val) => onChange(String(val))}
                      placeholder="MM"
                      noFloatingLabel
                    />
                  )}
                />
                <ErrorText message={errors.expirationMonth?.message} />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="expirationYear"
                  render={({ field: { onChange, value } }) => (
                    <CustomDropdown
                      data={YEARS}
                      value={value}
                      onChange={(val) => onChange(String(val))}
                      placeholder="YYYY"
                      noFloatingLabel
                    />
                  )}
                />
                <ErrorText message={errors.expirationYear?.message} />
              </View>
            </View>
          </View>

          {/* Billing address 1 */}
          <View>
            <FieldLabel label="Card billing address 1" required />
            <Controller
              control={control}
              name="AddressOne"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-gray-100 rounded-lg px-3 h-12 text-[#4A5568] border border-gray-200"
                  placeholderTextColor="#9ca3af"
                  placeholder="Billing address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <ErrorText message={errors.AddressOne?.message} />
          </View>

          {/* Billing address 2 */}
          <View>
            <FieldLabel label="Address 2" />
            <Controller
              control={control}
              name="AddressTwo"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-gray-100 rounded-lg px-3 h-12 text-[#4A5568] border border-gray-200"
                  placeholderTextColor="#9ca3af"
                  placeholder="Address 2 (optional)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* City + Zip */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel label="City" required />
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-gray-100 rounded-lg px-3 h-12 text-[#4A5568] border border-gray-200"
                    placeholderTextColor="#9ca3af"
                    placeholder="City"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              <ErrorText message={errors.city?.message} />
            </View>

            <View className="flex-1">
              <FieldLabel label="Zip / Postal Code" required />
              <Controller
                control={control}
                name="zipCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-gray-100 rounded-lg px-3 h-12 text-[#4A5568] border border-gray-200"
                    placeholderTextColor="#9ca3af"
                    placeholder="Zip code"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                )}
              />
              <ErrorText message={errors.zipCode?.message} />
            </View>
          </View>

          {/* Country + State */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel label="Country" required />
              <Controller
                control={control}
                name="country"
                render={({ field: { onChange, value } }) => (
                  <CustomDropdown
                    data={countries}
                    value={value}
                    onChange={(val) => onChange(String(val))}
                    placeholder="Select country"
                    noFloatingLabel
                  />
                )}
              />
              <ErrorText message={errors.country?.message} />
            </View>

            <View className="flex-1">
              <FieldLabel label="State / Region" required />
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, value } }) => (
                  <CustomDropdown
                    data={states}
                    value={value}
                    onChange={(val) => onChange(String(val))}
                    placeholder="Select state"
                    noFloatingLabel
                  />
                )}
              />
              <ErrorText message={errors.state?.message} />
            </View>
          </View>

          {/* Submit Button */}
          <View className="items-center mt-4 mb-2">
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

          {/* Go Back */}
          <Pressable
            className="items-center mb-4"
            onPress={() => router.back()}
          >
            <Text className="text-[#2B6CB0] underline font-medium text-sm">
              Go Back
            </Text>
          </Pressable>
        </View>

        {/* Slogan */}
        <View className="items-center mb-8 mt-4">
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
