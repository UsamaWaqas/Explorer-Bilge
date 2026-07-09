import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import HumidityIcon from "../../assets/Icons/Humidity";
import WindDirectionIcon from "../../assets/Icons/WindDirection";
import WindSpeedIcon from "../../assets/Icons/WindSpeed";
import { getWindDirection } from "../../utils/getWindDirection";
import { loadData, saveData } from "../../utils/asyncStorage";
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

const WEATHER_TILES_ORDER_KEY = "weather_tiles_order";

const NUM_COLUMNS = 2;
const GAP = 8;
const ITEM_HEIGHT = 100; // matches TileLayout's fixed height

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

// ── A single draggable tile ────────────────────────────────────────────
// Each tile owns its own pan gesture. The gesture only "activates" after a
// 200ms long-press, so a normal tap/scroll on the page is never hijacked.
// While dragging, onDragMove reports the live hovered slot so the parent can
// instantly swap the tile sitting there out of the way (live preview),
// instead of only swapping once the finger is lifted.
function DraggableTile({
  id,
  index,
  itemWidth,
  totalCount,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
}: {
  id: string;
  index: number;
  itemWidth: number;
  totalCount: number;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, hoveredIndex: number) => void;
  onDragEnd: (id: string) => void;
  children: React.ReactNode;
}) {
  const col = index % NUM_COLUMNS;
  const row = Math.floor(index / NUM_COLUMNS);

  const x = useSharedValue(col * (itemWidth + GAP));
  const y = useSharedValue(row * (ITEM_HEIGHT + GAP));
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);


  useEffect(() => {
    if (isDragging) return;
    const targetX = col * (itemWidth + GAP);
    const targetY = row * (ITEM_HEIGHT + GAP);
    x.value = withTiming(targetX, { duration: 200 });
    y.value = withTiming(targetY, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, itemWidth, isDragging]);

  const computeHoveredIndex = (px: number, py: number) => {
    "worklet";
    const totalRows = Math.ceil(totalCount / NUM_COLUMNS);
    const targetCol = Math.min(
      Math.max(Math.round(px / (itemWidth + GAP)), 0),
      NUM_COLUMNS - 1
    );
    const targetRow = Math.min(
      Math.max(Math.round(py / (ITEM_HEIGHT + GAP)), 0),
      totalRows - 1
    );
    return Math.min(
      Math.max(targetRow * NUM_COLUMNS + targetCol, 0),
      totalCount - 1
    );
  };

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      zIndex.value = 100;
      scale.value = withTiming(1.06, { duration: 150 });
      startX.value = x.value;
      startY.value = y.value;
      runOnJS(onDragStart)(id);
    })
    .onUpdate((e) => {
      x.value = startX.value + e.translationX;
      y.value = startY.value + e.translationY;
      const hovered = computeHoveredIndex(x.value, y.value);
      runOnJS(onDragMove)(id, hovered);
    })
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 150 });
      zIndex.value = 0;
      runOnJS(onDragEnd)(id);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    width: itemWidth,
    height: ITEM_HEIGHT,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}

export const WeatherSection = ({
  weatherData,
  loadingWeather,
  formatTime,
  isMarina = false,
  tides,
  loadingTides,
}: Props) => {
  const tileDefinitions = useMemo(
    () => [
      {
        id: "weather",
        render: () => (
          <TileLayout title="Weather">
            <View className="flex-row justify-between items-center">
              {weatherData?.weather?.[0]?.icon ? (
                <Image
                  source={{
                    uri: `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`,
                  }}
                  style={{ width: 56, height: 56 }}
                />
              ) : (
                <Ionicons name="partly-sunny" size={48} color="#60A5FA" />
              )}
              <View>
                <Text className="text-gray-500 text-xl font-bold text-center">
                  {weatherData?.main?.temp
                    ? `${Math.round(weatherData.main.temp)}°F`
                    : "NA"}
                </Text>
                <View className="flex-row gap-1">
                  <Text className="text-gray-400 text-[10px]">
                    Low{" "}
                    {weatherData?.main?.temp_min
                      ? `${Math.round(weatherData.main.temp_min)}°F`
                      : "NA"}
                  </Text>
                  <Text className="text-gray-400 text-[10px]">
                    High{" "}
                    {weatherData?.main?.temp_max
                      ? `${Math.round(weatherData.main.temp_max)}°F`
                      : "NA"}
                  </Text>
                </View>
              </View>
            </View>
          </TileLayout>
        ),
      },
      {
        id: "wind",
        render: () => (
          <TileLayout title="Wind">
            <View className="flex-row items-center gap-1 justify-around">
              <View className="flex-row items-center gap-[2px]">
                <WindDirectionIcon size={30} color="#60A5FA" />
                <Text className="text-gray-500 font-bold text-sm">
                  {weatherData?.wind?.deg != null
                    ? getWindDirection(weatherData.wind.deg)
                    : "NA"}
                </Text>
              </View>
              <View className="flex-row items-center">
                <WindSpeedIcon size={30} color="#60A5FA" />
                <Text className="text-gray-500 font-bold ml-1">
                  {weatherData?.wind?.speed ?? "NA"}
                </Text>
                {weatherData?.wind?.speed && (
                  <Text className="text-gray-400 text-[8px] mb-1 ml-[2px]">
                    MPH
                  </Text>
                )}
              </View>
            </View>
          </TileLayout>
        ),
      },
      {
        id: "tidesOrSun",
        render: () =>
          isMarina ? (
            <TileLayout title="Today's Tides">
              {loadingTides ? (
                <TidesSkeleton />
              ) : tides?.first ? (
                <View className="gap-y-[2px]">
                  {[tides?.first, tides?.second, tides?.third, tides?.fourth].map(
                    (tide, i) => {
                      if (!tide) return null;
                      const time = tide.substring(0, tide.lastIndexOf(" "));
                      const isHigh = tide.includes("HIGH");
                      const isLow = tide.includes("LOW");
                      return (
                        <View
                          key={i}
                          className="flex-row justify-between items-center"
                        >
                          <Text
                            className={`text-[10px] ${
                              i === 2
                                ? "text-red-500"
                                : i === 3
                                ? "text-green-500"
                                : "text-gray-500"
                            }`}
                          >
                            {time}
                          </Text>
                          <Text
                            className={`text-[10px] ${
                              i === 2
                                ? "text-red-500"
                                : i === 3
                                ? "text-green-500"
                                : "text-gray-500"
                            }`}
                          >
                            {isHigh ? "HIGH ▲" : isLow ? "LOW ▼" : ""}
                          </Text>
                          {i === 0 && (
                            <Text className="text-[10px] font-semibold text-gray-600">
                              NEXT
                            </Text>
                          )}
                          {i === 1 && (
                            <Text className="text-[10px] text-gray-500">
                              {tides?.next
                                ? tides.next.substring(0, tides.next.lastIndexOf(" "))
                                : ""}
                            </Text>
                          )}
                          {i === 2 && (
                            <Text className="text-[10px] text-red-500">
                              {tides?.next?.includes("LOW")
                                ? "LOW ▼"
                                : tides?.next?.includes("HIGH")
                                ? "HIGH ▲"
                                : ""}
                            </Text>
                          )}
                          {i === 3 && <Text className="text-[10px]"> </Text>}
                        </View>
                      );
                    }
                  )}
                </View>
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-gray-400 text-xs text-center">
                    No location set for this boat
                  </Text>
                </View>
              )}
            </TileLayout>
          ) : (
            <TileLayout title="Sunrise / Sunset">
              <View className="flex-row items-center justify-center mb-2">
                <Ionicons name="sunny" size={36} color="#FBBF24" />
                <Ionicons
                  name="moon"
                  size={36}
                  color="#60A5FA"
                  style={{ marginLeft: 16 }}
                />
              </View>
              <View className="flex-row justify-center">
                <Text className="text-base text-gray-500 font-bold">
                  {weatherData?.sys?.sunrise
                    ? formatTime(weatherData.sys.sunrise + (weatherData.timezone ?? 0))
                    : "NA"}
                </Text>
                <Text className="text-base text-gray-500 font-bold ml-8">
                  {weatherData?.sys?.sunset
                    ? formatTime(weatherData.sys.sunset + (weatherData.timezone ?? 0))
                    : "NA"}
                </Text>
              </View>
            </TileLayout>
          ),
      },
      {
        id: "humidity",
        render: () => (
          <TileLayout title="Humidity">
            <View className="flex-row justify-around mt-2">
              <View className="items-center mb-2 flex-row justify-center">
                <HumidityIcon size={42} color="#60A5FA" />
              </View>
              <Text className="text-xl font-bold text-gray-500 text-center">
                {weatherData?.main?.humidity != null
                  ? `${weatherData.main.humidity}%`
                  : "NA"}
              </Text>
            </View>
          </TileLayout>
        ),
      },
    ],
    [weatherData, formatTime, isMarina, tides, loadingTides]
  );

  const [order, setOrder] = useState<string[]>(tileDefinitions.map((t) => t.id));
  const [orderLoaded, setOrderLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    (async () => {
      const savedOrder = await loadData<string[]>(WEATHER_TILES_ORDER_KEY, []);
      const validIds = tileDefinitions.map((t) => t.id);
      const restored = savedOrder.filter((id) => validIds.includes(id));
      const missing = validIds.filter((id) => !restored.includes(id));
      setOrder(restored.length ? [...restored, ...missing] : validIds);
      setOrderLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orderLoaded) return;
    const validIds = tileDefinitions.map((t) => t.id);
    setOrder((prev) => {
      const restored = prev.filter((id) => validIds.includes(id));
      const missing = validIds.filter((id) => !restored.includes(id));
      return missing.length ? [...restored, ...missing] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileDefinitions, orderLoaded]);

  const tileMap = useMemo(() => {
    const map: Record<string, () => React.ReactNode> = {};
    tileDefinitions.forEach((t) => (map[t.id] = t.render));
    return map;
  }, [tileDefinitions]);

  // ── Live drag state ──────────────────────────────────────────────────
  // `order` is the committed (saved) order. While a tile is being dragged,
  // `dragId` + `hoverIndex` describe a live preview swap that hasn't been
  // committed yet. Refs mirror the state so the (non-React) gesture
  // callbacks always read the latest values, with zero timing risk.
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const orderRef = useRef(order);
  const dragIdRef = useRef<string | null>(null);
  const hoverIndexRef = useRef<number | null>(null);
  orderRef.current = order;

  // The order actually rendered: `order` with the dragged tile swapped into
  // its currently-hovered slot, recalculated live as the finger moves.
  const displayOrder = useMemo(() => {
    if (!dragId || hoverIndex == null) return order;
    const from = order.indexOf(dragId);
    if (from === -1 || from === hoverIndex) return order;
    const next = [...order];
    [next[from], next[hoverIndex]] = [next[hoverIndex], next[from]];
    return next;
  }, [order, dragId, hoverIndex]);

  const handleDragStart = (id: string) => {
    dragIdRef.current = id;
    hoverIndexRef.current = orderRef.current.indexOf(id);
    setDragId(id);
    setHoverIndex(hoverIndexRef.current);
  };

  const handleDragMove = (id: string, hovered: number) => {
    if (dragIdRef.current !== id) return;
    if (hoverIndexRef.current === hovered) return;
    hoverIndexRef.current = hovered;
    setHoverIndex(hovered);
  };

  // Commit whatever swap is currently being previewed, then clear drag state.
  const handleDragEnd = (id: string) => {
    const from = orderRef.current.indexOf(id);
    const to = hoverIndexRef.current;
    if (from !== -1 && to != null && from !== to) {
      const next = [...orderRef.current];
      [next[from], next[to]] = [next[to], next[from]];
      orderRef.current = next;
      setOrder(next);
      saveData(WEATHER_TILES_ORDER_KEY, next);
    }
    dragIdRef.current = null;
    hoverIndexRef.current = null;
    setDragId(null);
    setHoverIndex(null);
  };

  if (loadingWeather) return <TileSkeletons />;

  const rows = Math.ceil(order.length / NUM_COLUMNS);
  const gridHeight = rows * ITEM_HEIGHT + (rows - 1) * GAP;
  const itemWidth = containerWidth > 0 ? (containerWidth - GAP) / 2 : 0;

  return (
    <View
      style={{ width: "100%", height: itemWidth ? gridHeight : undefined }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {itemWidth > 0 &&
        displayOrder.map((id, index) => (
          <DraggableTile
            key={id}
            id={id}
            index={index}
            itemWidth={itemWidth}
            totalCount={displayOrder.length}
            isDragging={dragId === id}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            {tileMap[id]?.()}
          </DraggableTile>
        ))}
    </View>
  );
};