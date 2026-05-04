import { put } from "@/api/apiHelper";
import GlobalInput from "@/components/Input";
import { useAuthStore } from "@/store/authStore";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";

type FormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const validationSchema = Yup.object({
  oldPassword: Yup.string().required("Old password is required"),
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), undefined], "Passwords must match")
    .required("Please confirm your new password"),
});

const fields: {
  name: keyof FormValues;
  label: string;
  placeholder: string;
}[] = [
  { name: "oldPassword", label: "Old Password", placeholder: "Enter old password" },
  { name: "newPassword", label: "New Password", placeholder: "Enter new password" },
  { name: "confirmPassword", label: "Confirm New Password", placeholder: "Re-enter new password" },
];

const ChangePasswordScreen = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
     
      return;
    }

    setIsSubmitting(true);

    const response = await put(`/api/users/change-password/${user.id}`, {
      old_password: values.oldPassword,
      new_password: values.newPassword,
    });

    setIsSubmitting(false);

    if (response.success) {
    reset();
    // router.back();
  }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-5 py-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900">Change Password</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Update your account password below
          </Text>
        </View>

        {/* Card */}
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-6 gap-4">
          {fields.map(({ name, label, placeholder }) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field: { onChange, onBlur, value } }) => (
                <GlobalInput
                  label={label}
                  placeholder={placeholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors[name]?.message}
                  secureTextEntry
                  showPasswordToggle
                  autoCapitalize="none"
                />
              )}
            />
          ))}
        </View>

        {/* Buttons */}
        <View className="mt-6 gap-3">
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${
              isSubmitting || !isValid ? "bg-blue-300" : "bg-[#2C64B3]"
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Change Password
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-xl py-4 items-center border border-gray-200 bg-white"
            onPress={() => router.back()}
          >
            <Text className="text-gray-600 text-base font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;