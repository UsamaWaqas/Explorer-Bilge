import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface ChartData {
  labels: string[];
  values: number[];
}

interface TemperatureChartProps {
  data: ChartData;
  yaxisTitle?: string;
}

const TemperatureChart = ({ data, yaxisTitle }: TemperatureChartProps) => {
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("fahrenheit");

  const convertedValues = data.values.map((v) =>
    unit === "celsius" ? Number(((v - 32) * (5 / 9)).toFixed(2)) : v
  );

  const latest =
    convertedValues.length > 0
      ? convertedValues[convertedValues.length - 1]
      : null;

  const unitSymbol = unit === "celsius" ? "°C" : "°F";

  const lineData =
    convertedValues.length > 0
      ? convertedValues.map((val, index) => ({
          value: val ?? 0,
          label: data.labels[index] ?? "",
        }))
      : [{ value: 0, label: "" }];

  return (
    <View>
      {/* Title */}
      <Text className="text-[15px] font-bold text-gray-900 text-center mb-2">
        Temperature ({unitSymbol})
      </Text>

      {/* Celsius / Fahrenheit Radio Toggle */}
      <View className="flex-row justify-center gap-5 mb-3">
        {(["celsius", "fahrenheit"] as const).map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            className="flex-row items-center gap-1.5"
          >
            <View
              className={`w-[18px] h-[18px] rounded-full border-2 items-center justify-center ${
                unit === u
                  ? "border-[#2C64B3] bg-[#2C64B3]"
                  : "border-[#2C64B3] bg-white"
              }`}
            >
              {unit === u && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
            <Text className="text-xs text-gray-700">
              {u === "celsius" ? "Celsius (°C)" : "Fahrenheit (°F)"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Latest Temperature Row */}
      <View className="flex-row justify-between items-center bg-[#E3EFFF] rounded-lg px-3 py-2 mb-3">
        <Text className="text-[13px] font-semibold text-gray-900">
          Latest Temperature
        </Text>
        <Text className="text-[13px] font-semibold text-[#2C64B3]">
          {latest !== null && !isNaN(latest)
            ? `${latest}${unitSymbol}`
            : "NaN"}
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
            color="#2C64B3"
            thickness={2}
            curved
            hideDataPoints={data.values.length === 0}
            dataPointsColor="#2C64B3"
            dataPointsRadius={4}
            startFillColor="rgba(44, 100, 179, 0.2)"
            endFillColor="rgba(44, 100, 179, 0.0)"
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
                    pointerStripColor: "#2C64B3",
                    pointerStripWidth: 1,
                    pointerColor: "#2C64B3",
                    radius: 5,
                    pointerLabelWidth: 80,
                    pointerLabelHeight: 36,
                    activatePointersOnLongPress: false,
                    autoAdjustPointerLabelPosition: true,
                    pointerLabelComponent: (items: any[]) => (
                      <View className="bg-[#2C64B3] px-2 py-1 rounded-md">
                        <Text className="text-white text-[11px] font-bold">
                          {items[0]?.value}
                          {unitSymbol}
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

export default TemperatureChart;