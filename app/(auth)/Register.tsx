import GlobalInput from "@/components/Input";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import * as yup from "yup";
import { post } from "../../api/apiHelper";
import ArmITLogo from "../../assets/images/armIT_logo.svg";
import Thanks from "./Thanks";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const schema: yup.ObjectSchema<RegisterForm> = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Minimum 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);

    try {
      const response = await post("/api/users/register", { ...data, residence_customer: 1 }, {}, false);

      console.log("FULL RESPONSE:", response);

      setIsLoading(false);

      if (response?.isOffline) {
        Toast.show({
          type: "info",
          text1: "Offline",
          text2: "No internet connection",
          position: "top",
        });
        return;
      }

      if (response?.error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response?.message || "Something went wrong",
          position: "top",
        });
        return;
      }

      if (response?.message === "success") {
        Toast.show({
          type: "success",
          text1: "Verification Email Sent Successfully!",
          position: "top",
          visibilityTime: 3000,
        });

        setRegisteredEmail(data.email);
        setShowThanks(true);
      } else {
        Toast.show({
          type: "error",
          text1: response?.message || "Something went wrong",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (err) {
      setIsLoading(false);

      Toast.show({
        type: "error",
        text1: "Server Error",
        text2: "Please try again later",
      });
    }
  };

  const ErrorText = ({ message }: { message?: string }) =>
    message ? (
      <Text className="text-red-500 text-xs mt-1 ml-1">{message}</Text>
    ) : null;

 
  if (showThanks) {
    return <Thanks email={registeredEmail} />;
  }

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
          <ArmITLogo width={240} height={100} />
        </View>

        {/* Header */}
        <View className="mb-2">
          <Text className="text-[20px] font-semibold text-[#4A5568]">
            Thank you for your business!
          </Text>
          <Text className="text-[15px] text-[#6b7280] mt-1">
            Let's create an account to continue.
          </Text>
        </View>

        <View className="gap-3 mt-3">
          {/* First + Last Name */}
          <View className="flex gap-2">
            <View className="flex-1">
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <GlobalInput
                    placeholder="First Name"
                    value={value}
                    onChangeText={onChange}
                    inputClassName="h-12"
                    leftIcon={
                      <Ionicons name="person-outline" size={20} color="gray" />
                    }
                  />
                )}
              />
              <ErrorText message={errors.firstName?.message} />
            </View>

            <View className="flex-1">
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <GlobalInput
                    placeholder="Last Name"
                    value={value}
                    onChangeText={onChange}
                    inputClassName="h-12"
                    leftIcon={
                      <Ionicons name="person-outline" size={20} color="gray" />
                    }
                  />
                )}
              />
              <ErrorText message={errors.lastName?.message} />
            </View>
          </View>

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
                  leftIcon={
                    <Ionicons name="mail-outline" size={20} color="gray" />
                  }
                />
                <ErrorText message={errors.email?.message} />
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
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="lock-closed-outline" size={20} color="gray" />
                  }
                />
                <ErrorText message={errors.password?.message} />
              </View>
            )}
          />

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <View>
                <GlobalInput
                  placeholder="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  inputClassName="h-12"
                  leftIcon={
                    <Ionicons name="lock-closed-outline" size={20} color="gray" />
                  }
                />
                <ErrorText message={errors.confirmPassword?.message} />
              </View>
            )}
          />
        </View>

        {/* DONE Button */}
        <View className="items-center mt-8 mb-4">
          <Pressable
            className="bg-white border-2 h-14 w-32 border-[#2B6CB0] rounded-lg justify-center items-center"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#2B6CB0" />
            ) : (
              <Text className="text-[#2B6CB0] text-[14px] font-bold tracking-widest">
                DONE
              </Text>
            )}
          </Pressable>
        </View>

        {/* Terms */}
        <View className="items-center mb-8 px-4">
          <Text className="text-[#6b7280] text-[13px] text-center">
            By pressing <Text className="font-semibold">DONE</Text> you accept
            our{" "}
            <Text className="font-semibold text-[#2B6CB0]">Terms of Service</Text>
          </Text>
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
