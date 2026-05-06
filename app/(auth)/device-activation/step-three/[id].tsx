import React from "react";
import CustomDropdown from "../../../../components/Select";
import { states, countries } from "../../../../data/Data";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  cardNumber: yup.string().required("Card number is required").matches(/^\d{13,19}$/, "Invalid card number"),
  CVCCode: yup.string().required("CVC is required").matches(/^\d{3,4}$/, "Invalid CVC"),
  expirationMonth: yup.string().required("Month is required"),
  expirationYear: yup.string().required("Year is required"),
  AddressOne: yup.string().required("Billing address is required"),
  AddressTwo: yup.string().default(""),
  city: yup.string().required("City is required"),
  zipCode: yup.string().required("Zip code is required").matches(/^\d{5}(-\d{4})?$/, "Invalid zip code"),
  country: yup.string().required("Country is required"),
  state: yup.string().required("State is required"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
  <Text className="text-xs font-medium text-[#6B7280] mb-1.5">
    {label}
    {required && <Text className="text-red-500"> *</Text>}
  </Text>
);

const ErrorText = ({ message }: { message?: string }) =>
  message ? <Text className="text-red-500 text-xs mt-1 ml-1">{message}</Text> : null;

const inputClass = "bg-white border border-slate-300 rounded-xl px-3 h-11 text-[#374151] text-sm";

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepThree() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { id: userId, deviceId } = useLocalSearchParams<{ id: string; deviceId: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      firstName: "", lastName: "", cardNumber: "", CVCCode: "",
      expirationMonth: "", expirationYear: "",
      AddressOne: "", AddressTwo: "", city: "", zipCode: "", country: "", state: "",
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
        Toast.show({ type: "info", text1: "Offline", text2: "No internet connection", position: "top", visibilityTime: 3000 });
        return;
      }

      if (response?.success && response?.checkout_url) {
  await WebBrowser.openAuthSessionAsync(
    response.checkout_url,
    'myarmit://'
  );
  return;
}

      if (response?.error || response?.success === false) {
        Toast.show({ type: "error", text1: "Payment Failed", text2: response?.message || "Failed to process payment", position: "top", visibilityTime: 3000 });
        return;
      }

      Toast.show({ type: "success", text1: "Payment Successful!", position: "top", visibilityTime: 3000 });
      router.replace("/(auth)/Login");
    } catch {
      Toast.show({ type: "error", text1: "Payment Error", text2: "Failed to process payment. Please try again.", position: "top", visibilityTime: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

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
        <View className="h-1.5 bg-gray-200">
          <View className="h-1.5 bg-[#2B6CB0]" style={{ width: "100%" }} />
        </View>

        <View className="px-5 py-4 flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] text-[#2B6CB0] font-semibold uppercase tracking-widest mb-1">
              Step 3 of 3
            </Text>
            <Text className="text-lg font-bold text-[#374151] mb-1">Billing Setup</Text>
            <Text className="text-xs font-semibold text-[#6B7280] mb-1">Payment Details</Text>
            <Text className="text-xs text-[#9CA3AF] leading-4">
              Enter your card and billing information to complete activation.
            </Text>
          </View>

          <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[80px] items-center">
            <Text className="text-[10px] text-[#9CA3AF] font-medium mb-0.5">Selected Plan</Text>
            <Text className="text-xs font-bold text-[#374151] text-center">myARMIT{"\n"}12 Months</Text>
          </View>
        </View>
      </View>

      {/* Form Card */}
      <View className="mx-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 gap-4">

        {/* Card Holder Name */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FieldLabel label="First name" required />
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={inputClass}
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
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
                  className={inputClass}
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <ErrorText message={errors.lastName?.message} />
          </View>
        </View>

        {/* Card Number + CVC */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FieldLabel label="Card Number" required />
            <Controller
              control={control}
              name="cardNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row items-center border border-slate-300 rounded-xl bg-white h-11 px-3 gap-2">
                  <Ionicons name="card-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 text-[#374151] text-sm"
                    placeholder="Card number"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                </View>
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
                <View className="flex-row items-center border border-slate-300 rounded-xl bg-white h-11 px-3 gap-2">
                  <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 text-[#374151] text-sm"
                    placeholder="CVC"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              )}
            />
            <ErrorText message={errors.CVCCode?.message} />
          </View>
        </View>

        {/* Expiration Date */}
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

        {/* Billing Address 1 */}
        <View>
          <FieldLabel label="Card billing address 1" required />
          <Controller
            control={control}
            name="AddressOne"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="flex-row items-center border border-slate-300 rounded-xl bg-white h-11 px-3 gap-2">
                <Ionicons name="home-outline" size={16} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-[#374151] text-sm"
                  placeholder="Billing address"
                  placeholderTextColor="#9CA3AF"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </View>
            )}
          />
          <ErrorText message={errors.AddressOne?.message} />
        </View>

        {/* Billing Address 2 */}
        <View>
          <FieldLabel label="Address 2" />
          <Controller
            control={control}
            name="AddressTwo"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={inputClass}
                placeholder="Address 2 (optional)"
                placeholderTextColor="#9CA3AF"
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
                  className={inputClass}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
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
                  className={inputClass}
                  placeholder="Zip code"
                  placeholderTextColor="#9CA3AF"
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
      </View>

      {/* Footer */}
      <View className="mx-4 mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="font-semibold text-[#6B7280] text-sm">Complete activation</Text>
          <Text className="text-xs text-[#9CA3AF] mt-0.5">You'll be redirected to secure checkout.</Text>
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="bg-white border border-[#6B7280] h-10 w-28 rounded-lg items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#2B6CB0" />
          ) : (
            <Text className="text-[#2B6CB0] font-bold text-sm">Select</Text>
          )}
        </Pressable>
      </View>

      {/* Go Back */}
      <Pressable className="items-center mt-4" onPress={() => router.back()}>
        <Text className="text-[#2B6CB0] underline font-medium text-sm">Go Back</Text>
      </Pressable>

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