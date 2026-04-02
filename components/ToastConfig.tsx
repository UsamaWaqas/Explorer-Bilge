import { Ionicons } from "@expo/vector-icons";
import { Platform, Text, View, Pressable } from "react-native";
import { BaseToastProps } from "react-native-toast-message";
import Toast from "react-native-toast-message";

const IconWrapper = ({
  name,
  glowClass,
  iconBgClass,
}: {
  name: any;
  glowClass: string;
  iconBgClass: string;
}) => (
  <View className={`w-11 h-11 rounded-full items-center justify-center ${glowClass}`}>
    <View className={`w-8 h-8 rounded-full items-center justify-center ${iconBgClass}`}>
      <Ionicons name={name} size={18} color="white" />
    </View>
  </View>
);

const ToastCard = ({
  props,
  accentClass,
  glowClass,
  iconBgClass,
  iconName,
  dotClass,
}: {
  props: BaseToastProps;
  accentClass: string;
  glowClass: string;
  iconBgClass: string;
  iconName: any;
  dotClass: string;
}) => {
  return (
    <View
      className={`w-[92%] bg-white rounded-2xl px-4 pt-3.5 pb-3 border border-gray-100 border-l-[5px] ${accentClass}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.15,
        shadowRadius: 16,
        elevation: 99999,   // ← fix: Modal ke upar aane ke liye
        zIndex: 99999,      // ← fix
      }}
    >
      <View className="flex-row items-center">

        {/* Icon */}
        <View className="w-11">
          <IconWrapper
            name={iconName}
            glowClass={glowClass}
            iconBgClass={iconBgClass}
          />
        </View>

        {/* Text */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center gap-1.5">
            <View className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            <Text
              className="text-gray-900 text-[13.5px] font-bold tracking-wide flex-shrink"
              numberOfLines={1}
            >
              {props.text1}
            </Text>
          </View>

          {props.text2 && (
            <Text
              className="text-gray-500 text-[12px] mt-1 leading-[17px] pl-3"
              numberOfLines={2}
            >
              {props.text2}
            </Text>
          )}
        </View>

        {/* Close Button */}
        <Pressable
          onPress={() => Toast.hide()}
          className="w-7 h-7 bg-gray-100 rounded-full items-center justify-center ml-2"
        >
          <Ionicons name="close" size={14} color="#9CA3AF" />
        </Pressable>

      </View>
    </View>
  );
};

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastCard
      props={props}
      accentClass="border-l-green-500"
      glowClass="bg-green-100"
      iconBgClass="bg-green-500"
      iconName="checkmark-done"
      dotClass="bg-green-500"
    />
  ),

  error: (props: BaseToastProps) => (
    <ToastCard
      props={props}
      accentClass="border-l-red-500"
      glowClass="bg-red-100"
      iconBgClass="bg-red-500"
      iconName="alert-circle"
      dotClass="bg-red-500"
    />
  ),

  warning: (props: BaseToastProps) => (
    <ToastCard
      props={props}
      accentClass="border-l-orange-500"
      glowClass="bg-orange-100"
      iconBgClass="bg-orange-500"
      iconName="warning"
      dotClass="bg-orange-500"
    />
  ),

  info: (props: BaseToastProps) => (
    <ToastCard
      props={props}
      accentClass="border-l-blue-600"
      glowClass="bg-blue-100"
      iconBgClass="bg-blue-600"
      iconName="information-circle"
      dotClass="bg-blue-600"
    />
  ),
};