import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { get } from "@/api/apiHelper";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import ScheduleModal from "../../components/settings/ScheduleModal";

// ── Icons ──────────────────────────────────────────────────
const CalendarIcon = ({ size = 16, color = "#2C64B3" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const ClockIcon = ({ size = 16, color = "#2C64B3" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const DeviceIcon = ({ size = 16, color = "#2C64B3" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="3" width="20" height="14" rx="2" />
    <Path d="M8 21h8M12 17v4" />
  </Svg>
);

const EditIcon = ({ size = 16, color = "#6B7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);
// ──────────────────────────────────────────────────────────

export default function DeviceHealthSchedules() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  // ── Fetch schedules ──────────────────────────────────────
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["schedulesList"],
    queryFn: async () => {
      const res = await get("/api/device-health-schedulers");
      return res; 
    },
  });

  // ── Fetch user devices ───────────────────────────────────
  const { data: userDevices } = useQuery({
    queryKey: ["userDevices"],
    queryFn: async () => {
      const res = await get(`/api/inventoryDevices/relateduser?limit=-1`);
      return res; 
    },
    staleTime: 1000 * 60 * 5,
  });

 
  const devicesOptions = userDevices?.success
    ? userDevices.data.inventories.map((i: any) => ({
        ...i,
        label: i.xNID,
        value: i.id,
      }))
    : [];

  // ── Open create modal ────────────────────────────────────
  const openCreateModal = () => {
    setIsEditMode(false);
    setEditData(null);
    setModalOpen(true);
  };

  // ── Open edit modal ──────────────────────────────────────
  const openEditModal = (schedule: any) => {
    setIsEditMode(true);
    const formatted = {
      ...schedule,
      time_zone: { label: schedule.time_zone, value: schedule.time_zone },
      selected_devices: devicesOptions.filter((d: any) =>
        schedule.selected_devices.includes(d.id)
      ),
    };
    setEditData(formatted);
    setModalOpen(true);
  };

  
  const schedules = data?.data ?? [];

  return (
    <View className="flex-1 bg-[#F8FAFF]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-[14px] bg-white border-b border-gray-200">
        <View className="flex-row items-center gap-2.5">
          <Text className="text-[17px] font-bold text-[#2C64B3]">
            Device Health Schedules
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={openCreateModal}
            className="flex-row items-center gap-1.5 bg-[#2C64B3] px-3.5 py-2 rounded-lg"
          >
            {(isLoading || isRefetching) ? (
              <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.7 }] }} />
            ) : (
              <PlusIcon />
            )}
            <Text className="text-white font-semibold text-[13px]">
              New Schedule
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Schedule Cards */}
      <ScrollView
        contentContainerClassName="p-4 gap-3 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={["#2C64B3"]}
          />
        }
      >
        {schedules.length === 0 && !isLoading ? (
          <View className="items-center mt-20">
            <CalendarIcon size={48} color="#CBD5E1" />
            <Text className="text-slate-400 mt-3 text-[15px]">
              No schedules yet
            </Text>
          </View>
        ) : (
          schedules.map((schedule: any) => (
            <View
              key={schedule.id}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              {/* Card Header */}
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-2 flex-1">
                  <CalendarIcon size={17} />
                  <Text
                    numberOfLines={1}
                    className="font-bold text-sm text-gray-900 flex-1"
                  >
                    {schedule.schedule_title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openEditModal(schedule)}
                  className="p-1"
                >
                  <EditIcon />
                </TouchableOpacity>
              </View>

              {/* Time */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <ClockIcon size={14} />
                <Text className="text-[11px] text-gray-500 uppercase tracking-wide">
                  Time
                </Text>
                <Text className="text-sm font-semibold text-gray-900 ml-1">
                  {schedule.time}
                </Text>
              </View>

              {/* Days */}
              <View className="mb-3">
                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <CalendarIcon size={14} />
                  <Text className="text-[11px] text-gray-500 uppercase tracking-wide">
                    Days
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {schedule.days.map((day: string, i: number) => (
                    <View
                      key={i}
                      className="w-[30px] h-[30px] rounded-full bg-[#2C64B3] items-center justify-center"
                    >
                      <Text className="text-white text-[10px] font-semibold">
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Devices Count */}
              <View className="flex-row justify-between items-center pt-2.5 border-t border-gray-100">
                <View className="flex-row items-center gap-1.5">
                  <DeviceIcon size={14} />
                  <Text className="text-[11px] text-gray-500 uppercase tracking-wide">
                    Devices Count
                  </Text>
                </View>
                <Text className="text-[13px] font-semibold text-gray-900">
                  {schedule.selected_devices.length}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

  
      <ScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isEditMode={isEditMode}
        editData={editData}
        refetch={refetch}
        devicesOptions={devicesOptions}
      />
    </View>
  );
}