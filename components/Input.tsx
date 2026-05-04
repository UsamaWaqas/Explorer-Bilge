// components/GlobalInput.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode, forwardRef, useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

interface GlobalInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}


const GlobalInput = forwardRef<TextInput, GlobalInputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      secureTextEntry,
      showPasswordToggle = false,
      containerClassName = "",
      inputClassName = "",
      ...props
    },
    ref 
  ) => {
    const [hidden, setHidden] = useState<boolean>(secureTextEntry ?? false);

    return (
      <View className={` ${containerClassName}`}>
        {label && (
          <Text className="text-gray-800 mb-1 text-sm">{label}</Text>
        )}

        <View
          className={`flex-row items-center border rounded-md bg-white ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          {leftIcon && <View className="ml-3 mr-1">{leftIcon}</View>}

          <TextInput
            ref={ref} 
            className={`flex-1 py-2 px-3 text-base text-gray-900 ${inputClassName}`}
            secureTextEntry={hidden}
            placeholderTextColor="#A0AEC0"
            {...props}
          />

          {secureTextEntry && showPasswordToggle ? (
            <TouchableOpacity
              onPress={() => setHidden(!hidden)}
              className="pr-3"
            >
              <Ionicons
                name={hidden ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#A0AEC0"
              />
            </TouchableOpacity>
          ) : rightIcon ? (
            <View className="pr-3">{rightIcon}</View>
          ) : null}
        </View>

        {error && (
          <Text className="text-red-500 mt-1 text-xs">{error}</Text>
        )}
      </View>
    );
  }
);

GlobalInput.displayName = "GlobalInput";

export default GlobalInput;