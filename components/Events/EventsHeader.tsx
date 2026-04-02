// src/components/events/EventsHeader.tsx

import { Text, View } from "react-native";
import CustomDropdown from "../Select";
import { EVENT_TYPE_OPTIONS } from "../../constants/packetConstants";

interface Props {
  eventType: string;
  onEventTypeChange: (val: string) => void;
}

export const EventsHeader = ({ eventType, onEventTypeChange }: Props) => (
  <View className="flex-row mb-4 items-center justify-between py-1 px-3 bg-white border-b border-gray-200">
    <Text className="text-lg font-bold text-[#2C64B3]">
      Events Table
    </Text>
    <View className="flex-row mb-1 items-center gap-x-3">
      <CustomDropdown
        data={EVENT_TYPE_OPTIONS}
        value={eventType}
        onChange={(val) => onEventTypeChange(val as string)}
        placeholder="Events"
        style={{ width: 190 }}
        compact
      />
    </View>
  </View>
);