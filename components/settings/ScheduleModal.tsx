import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { post, put, del } from "@/api/apiHelper";
import GlobalInput from "@/components/Input";
import Toast from "react-native-toast-message";

const toast = {
  success: (msg: string) => Toast.show({ type: "success", text1: msg }),
  error:   (msg: string) => Toast.show({ type: "error",   text1: msg }),
};

// ── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon = ({ size = 18, color = "#6B7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const InfoIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" />
  </Svg>
);

const ChevronDownIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} strokeLinecap="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#2C64B3" strokeWidth={2.5} strokeLinecap="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

// ── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { label: "Mon", value: "mon" },
  { label: "Tue", value: "tue" },
  { label: "Wed", value: "wed" },
  { label: "Thu", value: "thu" },
  { label: "Fri", value: "fri" },
  { label: "Sat", value: "sat" },
  { label: "Sun", value: "sun" },
];

const TIMEZONES = Intl.supportedValuesOf
  ? Intl.supportedValuesOf("timeZone")
  : [
      "UTC", "America/New_York", "America/Chicago", "America/Denver",
      "America/Los_Angeles", "Europe/London", "Europe/Paris",
      "Asia/Karachi", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
    ];

// ── Types ────────────────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  selectedDevices: any[];
  timeHour: string;
  timeMinute: string;
  selectedTZ: { label: string; value: string } | null;
  selectedDays: string[];
}

// ── FieldError ────────────────────────────────────────────────────────────────

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <Text style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{message}</Text>
  ) : null;

// ── MultiSelectDropdown ───────────────────────────────────────────────────────

interface MultiSelectProps {
  options: any[];
  selected: any[];
  setSelected: (val: any[]) => void;
  placeholder?: string;
  loading?: boolean;
  error?: boolean;
}

function MultiSelectDropdown({
  options,
  selected,
  setSelected,
  placeholder = "Select...",
  loading = false,
  error = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const getKey   = (item: any) => item?.id ?? item?.value ?? item?.label;
  const getLabel = (item: any) => item?.label ?? item?.xNID ?? item?.name ?? String(item);
  const isSelected = (item: any) => selected.some((s) => getKey(s) === getKey(item));

  const toggle = (item: any) => {
    if (isSelected(item)) setSelected(selected.filter((s) => getKey(s) !== getKey(item)));
    else setSelected([...selected, item]);
  };

  const removeTag = (item: any) =>
    setSelected(selected.filter((s) => getKey(s) !== getKey(item)));

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View>
      <TouchableOpacity
        onPress={() => {
          if (!loading) {
            setOpen((v) => !v);
            setSearch("");
          }
        }}
        activeOpacity={0.8}
        style={{
          minHeight: 38,
          borderWidth: 1,
          borderColor: error ? "#ef4444" : open ? "#bfbfbf" : "#d1d5db",
          borderRadius: 4,
          backgroundColor: "#fff",
          paddingHorizontal: 8,
          paddingVertical: 6,
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        {loading ? (
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator size="small" color="#2C64B3" />
            <Text style={{ fontSize: 13, color: "#9CA3AF" }}>Loading devices...</Text>
          </View>
        ) : selected.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1, gap: 4 }}>
            {selected.map((item) => (
              <View
                key={getKey(item)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#e5efff",
                  borderRadius: 3,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: "#2C64B3", fontWeight: "500" }}>
                  {getLabel(item)}
                </Text>
                <TouchableOpacity
                  onPress={() => removeTag(item)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <CloseIcon size={11} color="#2C64B3" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: "#A0AEC0", flex: 1 }}>{placeholder}</Text>
        )}
        <ChevronDownIcon />
      </TouchableOpacity>

      {open && !loading && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 4,
            marginTop: 2,
            backgroundColor: "#fff",
            zIndex: 9999,
            elevation: 10,
            maxHeight: 200,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <TextInput
              autoFocus
              value={search}
              onChangeText={setSearch}
              placeholder="Search..."
              placeholderTextColor="#A0AEC0"
              style={{ fontSize: 13, color: "#111827", paddingVertical: 2 }}
            />
          </View>

          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text
                style={{ fontSize: 13, color: "#9CA3AF", padding: 12, textAlign: "center" }}
              >
                No options found
              </Text>
            ) : (
              filtered.map((item) => {
                const active = isSelected(item);
                return (
                  <TouchableOpacity
                    key={getKey(item)}
                    onPress={() => toggle(item)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      borderBottomWidth: 0.5,
                      borderBottomColor: "#f3f4f6",
                      backgroundColor: active ? "#eff6ff" : "#fff",
                    }}
                  >
                    <Text style={{ fontSize: 13, color: active ? "#2C64B3" : "#374151" }}>
                      {getLabel(item)}
                    </Text>
                    {active && <CheckIcon />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  editData?: any;
  refetch: () => void;
  devicesOptions?: any[];
}

export default function ScheduleModal({
  open,
  onClose,
  isEditMode = false,
  editData = null,
  refetch,
  devicesOptions = [],
}: Props) {
  const [isLoading, setIsLoading] = useState<"submitting" | "deleting" | null>(null);
  const [showTZPicker, setShowTZPicker] = useState(false);

  const timeZoneOptions = TIMEZONES.map((tz) => ({ label: tz, value: tz }));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      selectedDevices: [],
      timeHour: "09",
      timeMinute: "00",
      selectedTZ: null,
      selectedDays: [],
    },
  });


useEffect(() => {
  if (isEditMode && editData) {
    const [h, m] = (editData.time ?? "09:00").split(":");

    const tz = editData.time_zone;
    let tzValue = null;

    if (tz) {
      if (typeof tz === "object" && tz.value) {
        tzValue = { label: String(tz.value), value: String(tz.value) };
      } else if (typeof tz === "string") {
        tzValue = { label: tz, value: tz };
      }
    }

    const devices = editData.devices?.length
      ? editData.devices
      : devicesOptions.filter((d: any) =>
          (editData.selected_devices ?? []).includes(d.id)
        );

    reset({
      title: editData.schedule_title ?? "",
      timeHour: h ?? "09",
      timeMinute: m ?? "00",
      selectedTZ: tzValue,
      selectedDays: editData.days ?? [],
      selectedDevices: devices,
    });
  } else {
    // ✅ THIS IS THE FIX
    reset({
      title: "",
      selectedDevices: [],
      timeHour: "09",
      timeMinute: "00",
      selectedTZ: null,
      selectedDays: [],
    });
  }
}, [editData, devicesOptions, isEditMode]);
  const handleClose = () => {
    reset();
    setShowTZPicker(false);
    onClose();
  };

  const onSubmit = async (data: FormValues) => {
    const time = `${data.timeHour.padStart(2, "0")}:${data.timeMinute.padStart(2, "0")}`;

    try {
      setIsLoading("submitting");

      const apiPath = isEditMode
        ? `/api/device-health-schedulers/${editData.id}`
        : `/api/device-health-schedulers`;

      const payload = {
        schedule_title:   data.title,
        time_zone:        data.selectedTZ?.value,
        time,
        days:             data.selectedDays,
        selected_devices: data.selectedDevices.map((d) => d.id),
      };

      const res = isEditMode
        ? await put(apiPath, payload)
        : await post(apiPath, payload);

      if (res?.success) {
        toast.success(res.message);
        handleClose();
        refetch();
      } else {
        toast.error(res?.message ?? "Something went wrong");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message
          ? `Error: ${error.response.data.message}`
          : "Error occurred while saving schedule"
      );
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading("deleting");

      const res = await del(`/api/device-health-schedulers/${editData.id}`);

      if (res?.success) {
        toast.success(res?.message);
        handleClose();
        refetch();
      } else {
        toast.error(res?.message ?? "Something went wrong");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message
          ? `Error: ${error.response.data.message}`
          : "Error occurred while deleting schedule"
      );
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "92%",
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            maxHeight: "92%",
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
                Configure Schedule
              </Text>
              <InfoIcon />
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Schedule Title ── */}
            <View style={{ marginBottom: 14 }}>
               <Text style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
               Schedule Title
              </Text>
              <Controller
                control={control}
                name="title"
                rules={{ required: "Schedule title is required" }}
                render={({ field: { value, onChange } }) => (
                  <View
                    style={
                      errors.title
                        ? { borderWidth: 1, borderColor: "#ef4444", borderRadius: 4 }
                        : undefined
                    }
                  >
                    <GlobalInput
                      // label="Schedule Title"
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter schedule title"
                      containerClassName="mb-0"
                    />
                  </View>
                )}
              />
              <FieldError message={errors.title?.message} />
            </View>

            {/* ── Devices ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                Select Devices
              </Text>
              <Controller
                control={control}
                name="selectedDevices"
                rules={{
                  validate: (v) => v.length > 0 || "At least one device is required",
                }}
                render={({ field: { value, onChange } }) => (
                  <MultiSelectDropdown
                    options={devicesOptions}
                    selected={value}
                    setSelected={onChange}
                    placeholder={
                      devicesOptions.length === 0
                        ? "No devices available"
                        : "Select devices"
                    }
                    error={!!errors.selectedDevices}
                  />
                )}
              />
              <FieldError message={errors.selectedDevices?.message} />
            </View>

            {/* ── Time ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>Time</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                {/* Hour */}
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="timeHour"
                    rules={{
                      required: "Required",
                      validate: (v) => {
                        const n = parseInt(v, 10);
                        return (!isNaN(n) && n >= 0 && n <= 23) || "0–23";
                      },
                    }}
                    render={({ field: { value, onChange } }) => (
                      <View
                        style={
                          errors.timeHour
                            ? { borderWidth: 1, borderColor: "#ef4444", borderRadius: 4 }
                            : undefined
                        }
                      >
                        <GlobalInput
                          value={value}
                          onChangeText={(v) =>
                            onChange(v.replace(/[^0-9]/g, "").slice(0, 2))
                          }
                          keyboardType="numeric"
                          maxLength={2}
                          placeholder="HH"
                          inputClassName="text-center"
                        />
                      </View>
                    )}
                  />
                  <FieldError message={errors.timeHour?.message} />
                </View>

                {/* Separator */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#374151",
                    marginTop: 8,
                  }}
                >
                  :
                </Text>

                {/* Minute */}
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="timeMinute"
                    rules={{
                      required: "Required",
                      validate: (v) => {
                        const n = parseInt(v, 10);
                        return (!isNaN(n) && n >= 0 && n <= 59) || "0–59";
                      },
                    }}
                    render={({ field: { value, onChange } }) => (
                      <View
                        style={
                          errors.timeMinute
                            ? { borderWidth: 1, borderColor: "#ef4444", borderRadius: 4 }
                            : undefined
                        }
                      >
                        <GlobalInput
                          value={value}
                          onChangeText={(v) =>
                            onChange(v.replace(/[^0-9]/g, "").slice(0, 2))
                          }
                          keyboardType="numeric"
                          maxLength={2}
                          placeholder="MM"
                          inputClassName="text-center"
                        />
                      </View>
                    )}
                  />
                  <FieldError message={errors.timeMinute?.message} />
                </View>
              </View>
            </View>

            {/* ── Timezone ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                Timezone
              </Text>
              <Controller
                control={control}
                name="selectedTZ"
                rules={{ required: "Timezone is required" }}
                render={({ field: { value, onChange } }) => (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowTZPicker((v) => !v)}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: errors.selectedTZ ? "#ef4444" : "#d1d5db",
                        borderRadius: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: value ? "#111827" : "#A0AEC0",
                        }}
                      >
                        {value?.label ?? "Select timezone"}
                      </Text>
                      <ChevronDownIcon />
                    </TouchableOpacity>

                    {showTZPicker && (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: "#d1d5db",
                          borderRadius: 4,
                          marginTop: 2,
                          maxHeight: 180,
                          backgroundColor: "#fff",
                          elevation: 8,
                        }}
                      >
                        <ScrollView nestedScrollEnabled>
                          {timeZoneOptions.map((tz) => (
                            <TouchableOpacity
                              key={tz.value}
                              onPress={() => {
                                onChange(tz);
                                setShowTZPicker(false);
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 9,
                                borderBottomWidth: 0.5,
                                borderBottomColor: "#f3f4f6",
                                backgroundColor:
                                  value?.value === tz.value ? "#eff6ff" : "#fff",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  color:
                                    value?.value === tz.value ? "#2C64B3" : "#374151",
                                }}
                              >
                                {tz.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
              />
              <FieldError message={errors.selectedTZ?.message} />
            </View>

            {/* ── Days ── */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>Days</Text>
              <Controller
                control={control}
                name="selectedDays"
                rules={{
                  validate: (v) => v.length > 0 || "Select at least one day",
                }}
                render={({ field: { value, onChange } }) => (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {DAYS.map((day) => {
                      const active = value.includes(day.value);
                      return (
                        <TouchableOpacity
                          key={day.value}
                          onPress={() =>
                            onChange(
                              active
                                ? value.filter((d) => d !== day.value)
                                : [...value, day.value]
                            )
                          }
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: active
                              ? "#2C64B3"
                              : errors.selectedDays
                              ? "#ef4444"
                              : "#d1d5db",
                            backgroundColor: active ? "#2C64B3" : "#fff",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: active
                                ? "#fff"
                                : errors.selectedDays
                                ? "#ef4444"
                                : "#6B7280",
                            }}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
              <FieldError message={errors.selectedDays?.message} />
            </View>

            {/* ── Footer ── */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                {isEditMode && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      borderRadius: 8,
                      backgroundColor: "#ef4444",
                      minWidth: 80,
                      alignItems: "center",
                    }}
                  >
                    {isLoading === "deleting" ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                        Delete
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    minWidth: 80,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#374151", fontWeight: "600", fontSize: 14 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 8,
                    backgroundColor: "#2C64B3",
                    minWidth: 80,
                    alignItems: "center",
                  }}
                >
                  {isLoading === "submitting" ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}