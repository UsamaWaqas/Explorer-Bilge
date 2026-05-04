import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { EVENT_TYPE_OPTIONS } from "../../constants/packetConstants";
import CustomDropdown from "../Select";

interface Props {
  eventType: string;
  onEventTypeChange: (val: string) => void;

  viewMode?: "table" | "card";
  onViewModeChange?: (mode: "table" | "card") => void;

  hideTitle?: boolean;
}

export const EventsHeader = ({
  eventType,
  onEventTypeChange,
  viewMode,
  onViewModeChange,
  hideTitle,
}: Props) => {
  const showToggle = viewMode !== undefined && onViewModeChange !== undefined;
  const showTitle = !hideTitle;

  return (
    <View>
      {/* ── Row 1: Title + Dropdown ── */}
      <View
        className={`flex-row items-center justify-between py-1 ${
          showTitle ? "px-3 bg-white border-b border-gray-200" : ""
        }`}
      >
        {showTitle && (
          <Text className="text-lg font-bold text-[#2C64B3]">Events</Text>
        )}

        <View className="flex-row items-center gap-x-2">
          <CustomDropdown
            data={EVENT_TYPE_OPTIONS}
            value={eventType}
            onChange={(val) => onEventTypeChange(val as string)}
            placeholder="Events"
            style={{ width: 160 }}
            compact
          />
        </View>
      </View>

      {/* ── Row 2: Toggle — title ke neechey, right side par ── */}
      {showToggle && (
        <View className="flex-row  justify-end px-3 pt-2 pb-1 bg-white">
          <View className="flex-row border border-gray-200 rounded-lg overflow-hidden">
            <Pressable
              onPress={() => onViewModeChange!("table")}
              className={`px-2.5 py-1.5 ${
                viewMode === "table" ? "bg-[#2C64B3]" : "bg-white"
              }`}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === "table" ? "#fff" : "#6B7280"}
              />
            </Pressable>
            <Pressable
              onPress={() => onViewModeChange!("card")}
              className={`px-2.5 py-1.5 ${
                viewMode === "card" ? "bg-[#2C64B3]" : "bg-white"
              }`}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === "card" ? "#fff" : "#6B7280"}
              />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};