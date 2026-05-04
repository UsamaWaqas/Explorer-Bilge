import CustomDropdown from "@/components/Select";
import { countries, states } from "@/data/Data";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// ---------- FieldWrapper ----------
interface FieldInputProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FieldWrapper = ({ label, required, error, children }: FieldInputProps) => (
  <View className="flex-1 gap-1">
    <Text className="text-gray-700 text-sm">
      {label}
      {required && <Text className="text-red-500"> *</Text>}
    </Text>
    {children}
    {error ? <Text className="text-red-500 text-xs">{error}</Text> : null}
  </View>
);

// ---------- StyledInput ----------
interface StyledInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "number-pad" | "decimal-pad";
  secureTextEntry?: boolean;
  maxLength?: number;
}

const StyledInput = (props: StyledInputProps) => (
  <TextInput
    className="bg-gray-100 rounded-md px-3 py-2 text-gray-900 text-sm h-10 border border-gray-200"
    placeholderTextColor="#9ca3af"
    {...props}
  />
);

// ---------- Month / Year options ----------
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = String(i + 1).padStart(2, "0");
  return { label: m, value: m };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => {
  const y = String(currentYear + i);
  return { label: y, value: y };
});

const required = (label: string) => ({
  required: `${label} is required`,
});

// ---------- Main Component ----------
export default function AddDeviceStepThree() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: deviceId, userId } = useLocalSearchParams<{
    id: string;
    userId: string;
  }>();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
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
    try {
      const payload = {
        ...values,
        deviceId,
        userId,
        expirationDate: `${values.expirationMonth}/${values.expirationYear}`,
      };
      const response = await axios.post("/api/process-payment", payload);
      if (response.status !== 200) throw new Error("Failed to process payment");

      router.replace("/(tabs)/devices");
    } catch (error) {
      Alert.alert("Payment Error", "Failed to process payment. Please try again later.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View className="items-center mb-4 px-4">
        <Image
          source={require("../../../../../assets/images/armIT_logo.png")}
          className="w-[280px] h-[100px]"
          resizeMode="contain"
        />
      </View>

      {/* Progress Bar */}
      <View className="px-4 gap-2 mb-4 max-w-xl w-full self-center">
        <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <View className="h-2 bg-[#2B6CB0] rounded-full w-full" />
        </View>
        <Text className="text-base text-center text-gray-700">
          Step <Text className="text-[#2B6CB0] font-semibold">3</Text> of{" "}
          <Text className="text-[#2B6CB0] font-semibold">3</Text>
        </Text>
      </View>

      {/* Plan summary */}
      <View className="items-center mb-4 px-4">
        <Text className="text-base text-center text-gray-800">
          You selected myARMIT{"\n"}Unlimited 12 Months
        </Text>
      </View>

      {/* Form */}
      <View className="px-4 gap-4 max-w-xl w-full self-center">

        {/* Card holder name */}
        <View className="flex-row gap-3">
          <Controller
            control={control}
            name="firstName"
            rules={required("First name")}
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldWrapper label="Card holder first name" required error={errors.firstName?.message}>
                <StyledInput value={value} onChangeText={onChange} onBlur={onBlur} />
              </FieldWrapper>
            )}
          />
          <Controller
            control={control}
            name="lastName"
            rules={required("Last name")}
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldWrapper label="Last name" required error={errors.lastName?.message}>
                <StyledInput value={value} onChangeText={onChange} onBlur={onBlur} />
              </FieldWrapper>
            )}
          />
        </View>

        {/* Card number + CVC */}
        <View className="flex-row gap-3">
          <Controller
            control={control}
            name="cardNumber"
            rules={{
              required: "Card number is required",
              pattern: { value: /^\d{13,19}$/, message: "Invalid card number" },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldWrapper label="Card Number" required error={errors.cardNumber?.message}>
                <StyledInput value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="number-pad" maxLength={19} />
              </FieldWrapper>
            )}
          />
          <Controller
            control={control}
            name="CVCCode"
            rules={{
              required: "CVC is required",
              pattern: { value: /^\d{3,4}$/, message: "Invalid CVC" },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldWrapper label="CVC Code" required error={errors.CVCCode?.message}>
                <StyledInput value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="number-pad" maxLength={4} secureTextEntry />
              </FieldWrapper>
            )}
          />
        </View>

        {/* Expiration date */}
        <View>
          <Text className="text-gray-700 text-sm mb-1">
            Expiration Date <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row gap-3">
            <Controller
              control={control}
              name="expirationMonth"
              rules={required("Month")}
              render={({ field: { onChange, value } }) => (
                <View className="flex-1">
                  <CustomDropdown data={MONTHS} value={value} onChange={(val) => onChange(String(val))} placeholder="MM" noFloatingLabel />
                  {errors.expirationMonth && <Text className="text-red-500 text-xs mt-1">{errors.expirationMonth.message}</Text>}
                </View>
              )}
            />
            <Controller
              control={control}
              name="expirationYear"
              rules={required("Year")}
              render={({ field: { onChange, value } }) => (
                <View className="flex-1">
                  <CustomDropdown data={YEARS} value={value} onChange={(val) => onChange(String(val))} placeholder="YYYY" noFloatingLabel />
                  {errors.expirationYear && <Text className="text-red-500 text-xs mt-1">{errors.expirationYear.message}</Text>}
                </View>
              )}
            />
          </View>
        </View>

        {/* Billing address 1 */}
        <Controller
          control={control}
          name="AddressOne"
          rules={required("Billing address")}
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldWrapper label="Card billing address 1" required error={errors.AddressOne?.message}>
              <StyledInput value={value} onChangeText={onChange} onBlur={onBlur} />
            </FieldWrapper>
          )}
        />

        {/* Billing address 2 */}
        <Controller
          control={control}
          name="AddressTwo"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldWrapper label="Address 2">
              <StyledInput value={value} onChangeText={onChange} onBlur={onBlur} />
            </FieldWrapper>
          )}
        />

        {/* City + Zip */}
        <View className="flex-row gap-3">
          <Controller
            control={control}
            name="city"
            rules={required("City")}
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldWrapper label="City" required error={errors.city?.message}>
                <StyledInput value={value} onChangeText={onChange} onBlur={onBlur} />
              </FieldWrapper>
            )}
          />
          <Controller
            control={control}
            name="zipCode"
            rules={{
              required: "Zip code is required",
              pattern: { value: /^\d{5}(-\d{4})?$/, message: "Invalid zip code" },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FieldWrapper label="Zip / Postal Code" required error={errors.zipCode?.message}>
                <StyledInput value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="number-pad" maxLength={10} />
              </FieldWrapper>
            )}
          />
        </View>

        {/* Country + State */}
        <View className="flex-row gap-3">
          <Controller
            control={control}
            name="country"
            rules={required("Country")}
            render={({ field: { onChange, value } }) => (
              <FieldWrapper label="Country" required error={errors.country?.message}>
                <CustomDropdown data={countries} value={value} onChange={(val) => onChange(String(val))} placeholder="Select country" noFloatingLabel />
              </FieldWrapper>
            )}
          />
          <Controller
            control={control}
            name="state"
            rules={required("State")}
            render={({ field: { onChange, value } }) => (
              <FieldWrapper label="State / Region" required error={errors.state?.message}>
                <CustomDropdown data={states} value={value} onChange={(val) => onChange(String(val))} placeholder="Select state" noFloatingLabel />
              </FieldWrapper>
            )}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          activeOpacity={0.8}
          className={`rounded-xl py-3 items-center mt-2 ${isSubmitting ? "bg-blue-300" : "bg-[#2B6CB0]"}`}
        >
          <Text className="text-white text-base font-medium">
            {isSubmitting ? "Processing…" : "Complete Payment"}
          </Text>
        </TouchableOpacity>

        {/* Go back */}
        <TouchableOpacity onPress={() => router.back()} className="items-center mt-1 mb-4">
          <Text className="text-[#2B6CB0] underline font-medium text-sm">
            Go Back
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}