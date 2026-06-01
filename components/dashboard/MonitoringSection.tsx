
import { FontAwesome5 } from "@expo/vector-icons";
import { Text, View, ViewStyle } from "react-native";

import TileLayout from "../TileLayout";
import { TileSkeletons } from "./DashboardSkeleton";

interface TileConfig {
  label: string;
  value: string;
  icon: React.ReactNode;
  // ── FIX: textColor must be a proper ViewStyle, not `any` ─────────────────
  // Typing it as `any` allowed a JSX element / plain object to be passed in,
  // which React then tried to render as a child inside TileLayout → crash.
  textColor?: ViewStyle;
}

interface Props {
  tilesConfig: TileConfig[];
  alertCount: number | null;
  loadingMonitoring: boolean;
}

export const MonitoringSection = ({
  tilesConfig,
  alertCount,
  loadingMonitoring,
}: Props) => (
  <View>
    <Text className="text-[#2C64B3] text-base font-bold tracking-wide mb-3">
      MONITORING
    </Text>

    {loadingMonitoring ? (
      <TileSkeletons />
    ) : (
      <View className="flex-row flex-wrap justify-between gap-y-3">

        {/* Alerts */}
        <View style={{ width: "48.5%" }}>
          <TileLayout
            title="Alerts 24 Hrs"
            value={alertCount != null ? String(alertCount) : "NA"}
            Icon={
              <FontAwesome5
                name="exclamation-triangle"
                size={26}
                color="#EF4444"
              />
            }
          />
        </View>

        {/* Dynamic tiles */}
        {tilesConfig.map((tile, index) => (
          <View key={index} style={{ width: "48.5%" }}>
            <TileLayout
              title={tile.label}
              // ── FIX: ensure value is always a plain string ────────────────
              // If getTilesConfig returns a number, object, or React element
              // for `value`, rendering it inside <Text> would crash.
              value={
                typeof tile.value === "string" || typeof tile.value === "number"
                  ? String(tile.value)
                  : "NA"
              }
              Icon={tile.icon}
              // ── FIX: only pass textColor if it is a plain style object ────
              // Previously `tile.textColor` was typed as `any`, allowing a
              // JSX element or keyed object to flow into TileLayout's `style`
              // prop, which React interpreted as a child → render crash.
              style={
                tile.textColor &&
                typeof tile.textColor === "object" &&
                !("props" in tile.textColor)   
                  ? tile.textColor
                  : undefined
              }
            />
          </View>
        ))}

      </View>
    )}
  </View>
);