// src/components/settings/SettingsHeader.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

interface Props {
  isFetching: boolean;
  isSaving: boolean;
  isRefreshing: boolean;
  onSave: () => void;
}

// ── Vector Icons ──────────────────────────────────────────
const LockIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const ScheduleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const BellIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

const DotsIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="#2C64B3">
    <Circle cx="12" cy="5" r="1.5" />
    <Circle cx="12" cy="12" r="1.5" />
    <Circle cx="12" cy="19" r="1.5" />
  </Svg>
);
// ──────────────────────────────────────────────────────────

export const SettingsHeader = ({ isFetching, isSaving, isRefreshing, onSave }: Props) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const MenuItem = ({
    icon,
    label,
    onPress,
    isLast = false,
    isDanger = false,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    isLast?: boolean;
    isDanger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#F3F4F6",
        gap: 12,
      }}
    >
      {icon}
      <Text style={{ fontSize: 14, color: isDanger ? "#EF4444" : "#374151", fontWeight: "500" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
      }}
    >
      {/* Left — Title */}
      <Text style={{ fontSize: 17, fontWeight: "700", color: "#2C64B3" }}>
        Configure Tiles
      </Text>

      {/* Right — Actions */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>

        {(isFetching || isRefreshing) && !isSaving && (
          <ActivityIndicator size="small" color="#2C64B3" />
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving || isFetching || isRefreshing}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#2C64B3",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            minWidth: 120,
            alignItems: "center",
            justifyContent: "center",
            opacity: isSaving || isFetching || isRefreshing ? 0.6 : 1,
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>

        {/* 3-Dot Menu Button */}
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#2C64B3",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DotsIcon />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                position: "absolute",
                top: 60,
                right: 12,
                backgroundColor: "#fff",
                borderRadius: 12,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
                minWidth: 210,
                overflow: "hidden",
              }}
            >
              <MenuItem
                icon={<LockIcon />}
                label="Change Password"
                onPress={() => {
                  setMenuVisible(false);
                  router.push("/(tabs)/Change-password");
                }}
              />
<MenuItem
  icon={<ScheduleIcon />}
  label="Device Health Schedules"
  onPress={() => {
    setMenuVisible(false);
    router.push("/(tabs)/device-health-schedules"); 
  }}
/>

              <MenuItem
                icon={<BellIcon />}
                label="Notification Rules"
                onPress={() => {
                  setMenuVisible(false);
                  // router.push("/(tabs)/notification-rules");
                }}
              />

              {/* <MenuItem
                icon={<LogoutIcon />}
                label="Logout"
                isDanger
                isLast
                onPress={() => {
                  setMenuVisible(false);
                  // apna logout logic yahan
                }} */}
              {/* /> */}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};