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
  const hasValue =
    value !== null && value !== undefined && selectedItem !== undefined;

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
   
    <View style={[{ marginTop: 0, marginBottom: compact ? 0 : 6 }, style]}>

      {/* Floating Label */}
      {!noFloatingLabel && (
        <Animated.Text
          style={{
            position: "absolute",
            left: 10,
            zIndex: 10,
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
        style={[
          {
            position: "relative",
            borderRadius: 6,
            overflow: "visible",
            height: compact ? 32 : 40,
            borderWidth,
            borderColor,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
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
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: compact ? 8 : 12,
          }}
        >
          {hasValue ? (
            <Text
              style={{
                flex: 1,
                color: "#1F2937",
                fontSize: compact ? 12 : 14,
              }}
              numberOfLines={1}
            >
              {selectedItem!.label}
            </Text>
          ) : noFloatingLabel ? (
            <Text
              style={{
                flex: 1,
                color: "#9CA3AF",
                fontSize: compact ? 12 : 14,
              }}
              numberOfLines={1}
            >
              {placeholder}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
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
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          />
        </TouchableOpacity>

        {/* Options List */}
        <View
          style={[
            {
              position: "absolute",
              left: "8%",
              right: "8%",
              top: "30%",
              backgroundColor: "white",
              borderRadius: 8,
              overflow: "hidden",
            },
            styles.shadow,
          ]}
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
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                    backgroundColor: isSelected ? "#EFF6FF" : "white",
                  }}
                  onPress={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: isSelected ? "#2563EB" : "#1F2937",
                      fontWeight: isSelected ? "600" : "400",
                    }}
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