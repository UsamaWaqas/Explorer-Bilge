import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchDeviceNotificationService,
  fetchDeviceToggleStatusService,
  toggleDeviceAlertService,
  updateDeviceNotificationService,
} from "../../services/userDeviceservices";
import { SettingsModalProps } from "../../types/UserDevices.types";
import { loadData, saveData } from "../../utils/asyncStorage";
import { STORAGE_KEYS } from "../../constants/keys";

export default function SettingsModal({
  row,
  visible,
  onClose,
  onRefetch,
}: SettingsModalProps) {
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationNumber, setNotificationNumber] = useState("");
  const [alertStatus, setAlertStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  const cacheKey = `${STORAGE_KEYS.SETTINGS}_${row.device_id}`;

  useEffect(() => {
    if (!visible) return;
    setLoading(true);

    Promise.allSettled([
      fetchDeviceNotificationService(row.device_id),
      fetchDeviceToggleStatusService(row.device_id),
    ])
      .then(([notifRes, toggleRes]) => {
        const cached: any = {};

        if (notifRes.status === "fulfilled") {
          setNotificationEmail(notifRes.value.notificationEmail);
          setNotificationNumber(notifRes.value.notificationNumber);
          cached.notificationEmail = notifRes.value.notificationEmail;
          cached.notificationNumber = notifRes.value.notificationNumber;
        }

        if (toggleRes.status === "fulfilled") {
          setAlertStatus(toggleRes.value);
          cached.alertStatus = toggleRes.value;
        }

        // Online — cache update karo
        saveData(cacheKey, cached);
      })
      .catch(async () => {
        // Offline — cache se load karo
        const cached = await loadData<any>(cacheKey, null);
        if (cached) {
          setNotificationEmail(cached.notificationEmail ?? "");
          setNotificationNumber(cached.notificationNumber ?? "");
          setAlertStatus(cached.alertStatus ?? false);
        }
      })
      .finally(() => setLoading(false));
  }, [visible, row.device_id]);

  async function handleAlertToggle(val: boolean) {
    setAlertStatus(val);
    await toggleDeviceAlertService(row.device_id);

    // Cache mein bhi update karo
    const cached = await loadData<any>(cacheKey, {});
    await saveData(cacheKey, { ...cached, alertStatus: val });
  }

  async function handleSave() {
    const success = await updateDeviceNotificationService(
      row.device_id,
      notificationEmail,
      notificationNumber
    );

    if (success) {
      // Cache mein bhi update karo
      const cached = await loadData<any>(cacheKey, {});
      await saveData(cacheKey, {
        ...cached,
        notificationEmail,
        notificationNumber,
      });

      onRefetch();
      onClose();
    } else {
      console.log("Failed to update notification");
    }
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
    >
      <View className="flex-1 justify-end">

        {/* Backdrop */}
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
        />

        {/* Bottom Sheet */}
        <View className="bg-white rounded-t-2xl px-5 pt-5 pb-9">

          {/* Drag Handle */}
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />

          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-bold text-gray-900">
              Device Settings
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color="#2C64B3" className="my-6" />
          ) : (
            <>
              {/* DevEUI */}
              <View className="flex-row items-center mb-3.5">
                <Text className="font-bold text-gray-700">DEVEUI: </Text>
                <Text className="text-gray-700">{row?.devEUI ?? "---"}</Text>
              </View>

              {/* Alert Toggle */}
              <View className="flex-row items-center mb-3.5">
                <Text className="font-bold text-gray-700 flex-1">
                  Alert ON/OFF:
                </Text>
                <Switch
                  value={alertStatus}
                  onValueChange={handleAlertToggle}
                  trackColor={{ false: "#d1d5db", true: "#2C64B3" }}
                  thumbColor="#fff"
                />
              </View>

              {/* Notification Number */}
              <Text className="text-xs font-semibold text-gray-700 mb-1">
                Notification Number
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-[13px] mb-3 text-gray-900"
                placeholder="Notification Number"
                value={notificationNumber}
                onChangeText={setNotificationNumber}
                keyboardType="phone-pad"
              />

              {/* Notification Email */}
              <Text className="text-xs font-semibold text-gray-700 mb-1">
                Notification Email
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-[13px] mb-3 text-gray-900"
                placeholder="Notification Email"
                value={notificationEmail}
                onChangeText={setNotificationEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Save Button */}
              <Pressable
                className="bg-green-500 rounded-lg py-2.5 items-center mt-2 active:bg-green-600"
                onPress={handleSave}
              >
                <Text className="text-white font-bold text-sm">Save</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}