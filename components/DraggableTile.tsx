import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { loadData, saveData } from "../utils/asyncStorage";

// Grid layout constants — fixed pixel math instead of relying on FlatList
// grid internals, which conflict with the outer ScrollView's gestures.
const NUM_COLUMNS = 2;
const GAP = 8;
const ITEM_HEIGHT = 100; // matches TileLayout's fixed height

export interface DraggableGridItem {
  id: string;
  render: () => React.ReactNode;
}

interface DraggableTileProps {
  id: string;
  index: number;
  itemWidth: number;
  totalCount: number;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, hoveredIndex: number) => void;
  onDragEnd: (id: string) => void;
  children: React.ReactNode;
}


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
}: DraggableTileProps) {
  const col = index % NUM_COLUMNS;
  const row = Math.floor(index / NUM_COLUMNS);

  const x = useSharedValue(col * (itemWidth + GAP));
  const y = useSharedValue(row * (ITEM_HEIGHT + GAP));
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  // Snap this tile to its grid slot whenever its index changes — but never
  // while it's the tile actively being dragged (it must keep following the
  // finger, not jump back to a computed slot mid-drag).
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

// ── The grid itself ─────────────────────────────────────────────────────
// Pass `items` (id + render fn) and a unique `storageKey`. Order is
// persisted to AsyncStorage under that key and restored on mount.
export function DraggableTileGrid({
  items,
  storageKey,
}: {
  items: DraggableGridItem[];
  storageKey: string;
}) {
  const [order, setOrder] = useState<string[]>(items.map((t) => t.id));
  const [orderLoaded, setOrderLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Live drag state. `order` is the committed (saved) order; while a tile
  // is being dragged, `dragId` + `hoverIndex` describe a live preview swap
  // that hasn't been committed yet. Refs mirror the state so the
  // (non-React) gesture callbacks always read the latest values.
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const orderRef = useRef(order);
  const dragIdRef = useRef<string | null>(null);
  const hoverIndexRef = useRef<number | null>(null);
  orderRef.current = order;

  useEffect(() => {
    (async () => {
      const savedOrder = await loadData<string[]>(storageKey, []);
      const validIds = items.map((t) => t.id);
      const restored = savedOrder.filter((id) => validIds.includes(id));
      const missing = validIds.filter((id) => !restored.includes(id));
      setOrder(restored.length ? [...restored, ...missing] : validIds);
      setOrderLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // If the set of ids changes (e.g. device switch changes tilesConfig),
  // keep the existing order for ids that still exist and append new ones.
  useEffect(() => {
    if (!orderLoaded) return;
    const validIds = items.map((t) => t.id);
    setOrder((prev) => {
      const restored = prev.filter((id) => validIds.includes(id));
      const missing = validIds.filter((id) => !restored.includes(id));
      return missing.length || restored.length !== prev.length
        ? [...restored, ...missing]
        : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, orderLoaded]);

  const tileMap = useMemo(() => {
    const map: Record<string, () => React.ReactNode> = {};
    items.forEach((t) => (map[t.id] = t.render));
    return map;
  }, [items]);

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
      saveData(storageKey, next);
    }
    dragIdRef.current = null;
    hoverIndexRef.current = null;
    setDragId(null);
    setHoverIndex(null);
  };

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
}