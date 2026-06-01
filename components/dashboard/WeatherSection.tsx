import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";

import HumidityIcon from "../../assets/Icons/Humidity";
import WindDirectionIcon from "../../assets/Icons/WindDirection";
import WindSpeedIcon from "../../assets/Icons/WindSpeed";
import { getWindDirection } from "../../utils/getWindDirection";
import TileLayout from "../TileLayout";
import { TileSkeletons } from "./DashboardSkeleton";

interface Tides {
  first: string;
  second: string;
  third: string;
  fourth: string;
  next: string;
}

interface Props {
  weatherData: any;
  loadingWeather: boolean;
  formatTime: (unix: number) => string;
  isMarina?: boolean;
  tides?: Tides;
  loadingTides?: boolean;
}

const TidesSkeleton = () => (
  <View className="gap-y-[6px]">
    {[1, 2, 3, 4].map((i) => (
      <View key={i} className="flex-row justify-between items-center">
        <View className="h-2 w-14 bg-gray-200 rounded-full" />
        <View className="h-2 w-10 bg-gray-200 rounded-full" />
        <View className="h-2 w-8 bg-gray-200 rounded-full" />
      </View>
    ))}
  </View>
);

export const WeatherSection = ({
  weatherData,
  loadingWeather,
  formatTime,
  isMarina = false,
  tides,
  loadingTides,
}: Props) => {
  if (loadingWeather) return <TileSkeletons />;

  return (
    <View className="flex-row flex-wrap gap-y-3 justify-between">

      {/* Weather */}
      <TileLayout title="Weather" style={{ width: "48.5%" }}>
        <View className="flex-row justify-between items-center">
          {weatherData?.weather?.[0]?.icon ? (
            <Image
              source={{ uri: `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png` }}
              style={{ width: 56, height: 56 }}
            />
          ) : (
            <Ionicons name="partly-sunny" size={48} color="#60A5FA" />
          )}
          <View>
            <Text className="text-gray-500 text-xl font-bold text-center">
              {weatherData?.main?.temp ? `${Math.round(weatherData.main.temp)}°F` : "NA"}
            </Text>
            <View className="flex-row gap-1">
              <Text className="text-gray-400 text-[10px]">
                Low {weatherData?.main?.temp_min ? `${Math.round(weatherData.main.temp_min)}°F` : "NA"}
              </Text>
              <Text className="text-gray-400 text-[10px]">
                High {weatherData?.main?.temp_max ? `${Math.round(weatherData.main.temp_max)}°F` : "NA"}
              </Text>
            </View>
          </View>
        </View>
      </TileLayout>

      {/* Wind */}
      <TileLayout title="Wind" style={{ width: "48.5%" }}>
        <View className="flex-row items-center gap-1 justify-around">
          <View className="flex-row items-center gap-[2px]">
            <WindDirectionIcon size={30} color="#60A5FA" />
            <Text className="text-gray-500 font-bold text-sm">
              {weatherData?.wind?.deg != null ? getWindDirection(weatherData.wind.deg) : "NA"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <WindSpeedIcon size={30} color="#60A5FA" />
            <Text className="text-gray-500 font-bold ml-1">
              {weatherData?.wind?.speed ?? "NA"}
            </Text>
            {weatherData?.wind?.speed && (
              <Text className="text-gray-400 text-[8px] mb-1 ml-[2px]">MPH</Text>
            )}
          </View>
        </View>
      </TileLayout>

      {/* Tides (marina) or Sunrise/Sunset */}
      {isMarina ? (
        <TileLayout title="Today's Tides" style={{ width: "48.5%" }}>
          {loadingTides ? (
            <TidesSkeleton />
          ) : tides?.first ? (
            <View className="gap-y-[2px]">
              {[tides?.first, tides?.second, tides?.third, tides?.fourth].map((tide, i) => {
                if (!tide) return null;
                const time = tide.substring(0, tide.lastIndexOf(" "));
                const isHigh = tide.includes("HIGH");
                const isLow = tide.includes("LOW");
                return (
                  <View key={i} className="flex-row justify-between items-center">
                    <Text className={`text-[10px] ${i === 2 ? "text-red-500" : i === 3 ? "text-green-500" : "text-gray-500"}`}>
                      {time}
                    </Text>
                    <Text className={`text-[10px] ${i === 2 ? "text-red-500" : i === 3 ? "text-green-500" : "text-gray-500"}`}>
                      {isHigh ? "HIGH ▲" : isLow ? "LOW ▼" : ""}
                    </Text>
                    {i === 0 && (
                      <Text className="text-[10px] font-semibold text-gray-600">NEXT</Text>
                    )}
                    {i === 1 && (
                      <Text className="text-[10px] text-gray-500">
                        {tides?.next ? tides.next.substring(0, tides.next.lastIndexOf(" ")) : ""}
                      </Text>
                    )}
                    {i === 2 && (
                      <Text className="text-[10px] text-red-500">
                        {tides?.next?.includes("LOW") ? "LOW ▼" : tides?.next?.includes("HIGH") ? "HIGH ▲" : ""}
                      </Text>
                    )}
                    {i === 3 && <Text className="text-[10px]"> </Text>}
                  </View>
                );
              })}
            </View>
          ) : (
            // Fallback when marina boat has no lat/lng set
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-400 text-xs text-center">
                No location set for this boat
              </Text>
            </View>
          )}
        </TileLayout>
      ) : (
        <TileLayout title="Sunrise / Sunset" style={{ width: "48.5%" }}>
          <View className="flex-row items-center justify-center mb-2">
            <Ionicons name="sunny" size={36} color="#FBBF24" />
            <Ionicons name="moon" size={36} color="#60A5FA" style={{ marginLeft: 16 }} />
          </View>
          <View className="flex-row justify-center">
            <Text className="text-base text-gray-500 font-bold">
              {weatherData?.sys?.sunrise ? formatTime(weatherData.sys.sunrise + (weatherData.timezone ?? 0)) : "NA"}
            </Text>
            <Text className="text-base text-gray-500 font-bold ml-8">
              {weatherData?.sys?.sunset ? formatTime(weatherData.sys.sunset + (weatherData.timezone ?? 0)) : "NA"}
            </Text>
          </View>
        </TileLayout>
      )}

      {/* Humidity */}
      <TileLayout title="Humidity" style={{ width: "48.5%" }}>
        <View className="flex-row justify-around mt-2">
          <View className="items-center mb-2 flex-row justify-center">
            <HumidityIcon size={42} color="#60A5FA" />
          </View>
          <Text className="text-xl font-bold text-gray-500 text-center">
            {weatherData?.main?.humidity != null ? `${weatherData.main.humidity}%` : "NA"}
          </Text>
        </View>
      </TileLayout>

    </View>
  );
};