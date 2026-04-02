import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleProp,
  ViewStyle,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DropdownItem {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  data: DropdownItem[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  label?: string;
  disabled?: boolean;
  compact?: boolean;
  backgroundColor?: string;
  noFloatingLabel?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  data,
  value,
  onChange,
  placeholder = "Select",
  style,
  label,
  disabled = false,
  compact = false,
  backgroundColor = "white",
  noFloatingLabel = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = data.find((item) => item.value === value);
  const hasValue = value !== null && value !== undefined && selectedItem !== undefined;

  const isActive = noFloatingLabel ? false : isOpen || hasValue;

  const displayLabel = label || placeholder;
  const labelWidth = displayLabel.length * 5 + 8;

  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isActive ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const labelTop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [compact ? 10 : 13, -9],
  });

  const labelFontSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 10],
  });

  const borderColor = isOpen ? "#1a73e8" : "#D1D5DB";
  const borderWidth = isOpen ? 2 : 1;

  return (
    <View className={compact ? "mt-1 mb-0" : "mt-2.5 mb-1.5"} style={style}>

      {/* Floating Label */}
      {!noFloatingLabel && (
        <Animated.Text
          className="absolute    left-2.5 z-10"
          style={{
            top: labelTop,
            fontSize: labelFontSize,
            color: isOpen ? "#1a73e8" : isActive ? "#6B7280" : "#9CA3AF",
            backgroundColor: isActive ? backgroundColor : "transparent",
            paddingHorizontal: isActive ? 4 : 0,
          }}
          pointerEvents="none"
        >
          {displayLabel}
        </Animated.Text>
      )}

      {/* Trigger Button */}
      <TouchableOpacity
        className={`relative  rounded-md overflow-visible ${compact ? "h-10" : "h-12"} ${disabled ? "opacity-60" : ""}`}
        style={{ borderWidth, borderColor }}
        onPress={() => !disabled && setIsOpen(true)}
        activeOpacity={0.7}
      >
        {/* MUI Notch */}
        {isActive && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -borderWidth,
              left: 8,
              width: labelWidth,
              height: borderWidth + 2,
              backgroundColor,
              zIndex: 1,
            }}
          />
        )}

        {/* Content Row */}
        <View
          className={`flex-1 flex-row items-center justify-between ${compact ? "px-2" : "px-3"}`}
        >
          {hasValue ? (
            <Text
              className={`flex-1 text-gray-800 ${compact ? "text-xs" : "text-sm"}`}
              numberOfLines={1}
            >
              {selectedItem!.label}
            </Text>
          ) : noFloatingLabel ? (
            <Text
              className={`flex-1 text-gray-400 ${compact ? "text-xs" : "text-sm"}`}
              numberOfLines={1}
            >
              {placeholder}
            </Text>
          ) : (
            <View className="flex-1" />
          )}

          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={compact ? 12 : 16}
            color={isOpen ? "#1a73e8" : "#6B7280"}
          />
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View className="absolute inset-0 bg-black/20" />
        </TouchableOpacity>

        {/* Options List */}
        <View
          className="absolute left-[8%] right-[8%] top-[30%] bg-white rounded-lg overflow-hidden"
          style={styles.shadow}
        >
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.value)}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 260 }}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <TouchableOpacity
                  className={`px-4 py-3.5 border-b border-gray-100 ${isSelected ? "bg-blue-50" : "bg-white"}`}
                  onPress={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm ${isSelected ? "text-blue-600 font-semibold" : "text-gray-800"}`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CustomDropdown;