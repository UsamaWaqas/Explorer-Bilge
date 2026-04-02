import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleSheet, View } from "react-native";

interface Props {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}

export default function SkeletonShimmer({
  width = "48%",
  height = 120,
  borderRadius = 6,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        overflow: "hidden",
        backgroundColor: "#E2E8F0",
      }}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateX: shimmerTranslate }] },
        ]}
      >
        <LinearGradient
          colors={[
            "#E2E8F0",
            "#E2E8F0",
            "#F8FAFC",
            "#FFFFFF",
            "#F8FAFC",
            "#E2E8F0",
          ]}
          locations={[0, 0.3, 0.5, 0.6, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 350, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
}