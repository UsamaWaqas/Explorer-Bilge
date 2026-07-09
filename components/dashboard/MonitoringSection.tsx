import { FontAwesome5 } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View, ViewStyle } from "react-native";

import TileLayout from "../TileLayout";
import { TileSkeletons } from "./DashboardSkeleton";
import { DraggableTileGrid } from "../../components/DraggableTile";

interface TileConfig {
  label: string;
  value: string;
  icon: React.ReactNode;

  textColor?: ViewStyle;
}

interface Props {
  tilesConfig: TileConfig[];
  alertCount: number | null;
  loadingMonitoring: boolean;
}

const MONITORING_TILES_ORDER_KEY = "monitoring_tiles_order";

export const MonitoringSection = ({
  tilesConfig,
  alertCount,
  loadingMonitoring,
}: Props) => {

  const items = useMemo(() => {
    const alertsTile = {
      id: "alerts24h",
      render: () => (
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
      ),
    };

    const dynamicTiles = tilesConfig.map((tile, index) => ({
      id: `${tile.label || "tile"}-${index}`,
      render: () => (
        <TileLayout
          title={tile.label}
        
          value={
            typeof tile.value === "string" || typeof tile.value === "number"
              ? String(tile.value)
              : "NA"
          }
          Icon={tile.icon}
         
          style={
            tile.textColor &&
            typeof tile.textColor === "object" &&
            !("props" in tile.textColor)
              ? tile.textColor
              : undefined
          }
        />
      ),
    }));

    return [alertsTile, ...dynamicTiles];
  }, [tilesConfig, alertCount]);

  return (
    <View>
      <Text className="text-[#2C64B3] text-base font-bold tracking-wide mb-3">
        MONITORING
      </Text>

      {loadingMonitoring ? (
        <TileSkeletons />
      ) : (
        <DraggableTileGrid items={items} storageKey={MONITORING_TILES_ORDER_KEY} />
      )}
    </View>
  );
};