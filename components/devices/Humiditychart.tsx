import React from "react";
import { View, Text, ScrollView } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface ChartData {
  labels: string[];
  values: number[];
}

interface HumidityChartProps {
  data: ChartData;
}

const HumidityChart = ({ data }: HumidityChartProps) => {
  const latest =
    data.values.length > 0 ? data.values[data.values.length - 1] : null;

  const lineData =
    data.values.length > 0
      ? data.values.map((val, index) => ({
          value: val ?? 0,
          label: data.labels[index] ?? "",
        }))
      : [{ value: 0, label: "" }];

  return (
    <View>
      {/* Title */}
      <Text className="text-[15px] font-bold text-gray-900 text-center mb-3">
        Humidity (g.m⁻³)
      </Text>

      {/* Latest Humidity Row */}
      <View className="flex-row justify-between items-center bg-[#E3EFFF] rounded-lg px-3 py-2 mb-3">
        <Text className="text-[13px] font-semibold text-gray-900">
          Latest Humidity
        </Text>
        <Text className="text-[13px] font-semibold text-[#2C64B3]">
          {latest !== null && !isNaN(latest) ? `${latest}%` : "---"}
        </Text>
      </View>

      {/* Chart Card */}
      <View
        className="rounded-xl overflow-hidden"
        style={{ borderWidth: 1, borderColor: "#E5EAF2" }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={lineData}
            height={180}
            spacing={50}
            initialSpacing={16}
            endSpacing={16}
            color="#06b6d4"
            thickness={2}
            curved
            hideDataPoints={data.values.length === 0}
            dataPointsColor="#06b6d4"
            dataPointsRadius={4}
            startFillColor="rgba(6, 182, 212, 0.2)"
            endFillColor="rgba(6, 182, 212, 0.0)"
            areaChart
            backgroundColor="#FAFAFA"
            rulesColor="#e5e7eb"
            rulesType="solid"
            yAxisColor="#e5e7eb"
            xAxisColor="#e5e7eb"
            yAxisTextStyle={{ color: "#9ca3af", fontSize: 10 }}
            xAxisLabelTextStyle={{
              color: "#9ca3af",
              fontSize: 9,
              width: 44,
              textAlign: "center",
            }}
            noOfSections={4}
            animateOnDataChange
            animationDuration={800}
            pointerConfig={
              data.values.length > 0
                ? {
                    pointerStripHeight: 140,
                    pointerStripColor: "#06b6d4",
                    pointerStripWidth: 1,
                    pointerColor: "#06b6d4",
                    radius: 5,
                    pointerLabelWidth: 80,
                    pointerLabelHeight: 36,
                    activatePointersOnLongPress: false,
                    autoAdjustPointerLabelPosition: true,
                    pointerLabelComponent: (items: any[]) => (
                      <View className="bg-cyan-500 px-2 py-1 rounded-md">
                        <Text className="text-white text-[11px] font-bold">
                          {items[0]?.value} g/m³
                        </Text>
                      </View>
                    ),
                  }
                : undefined
            }
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default HumidityChart;