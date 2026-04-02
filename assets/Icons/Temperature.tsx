import React from "react";
import Svg, { Path, Circle, Rect } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
}

export default function Temperature({ color = "#2C64B3", size = 42 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Thermometer tube outline */}
      <Path
        d="M12 2a2.5 2.5 0 0 0-2.5 2.5v8.26A4.5 4.5 0 1 0 14.5 12.76V4.5A2.5 2.5 0 0 0 12 2Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mercury fill inside tube */}
      <Rect
        x={10.75}
        y={9}
        width={2.5}
        height={5}
        rx={1.25}
        fill={color}
        opacity={0.85}
      />

      {/* Mercury bulb fill */}
      <Circle cx={12} cy={16.5} r={2.2} fill={color} opacity={0.85} />

      {/* Tick marks on the right side */}
      <Path
        d="M14.5 6h1.2M14.5 8h1.2M14.5 10h1.2"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}