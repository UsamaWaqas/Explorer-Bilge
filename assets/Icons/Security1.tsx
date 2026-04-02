import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface Props { size?: number; color?: string; }

export default function Security1({ size = 40, color = "#2C64B3" }: Props) {
  return (
    <Svg viewBox="0 0 117 134" fill="none" width={size} height={size}>
      <Path d="M79.042 43.1543L50.8467 81.0073L38.3271 66.7534" stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M111.385 24.3369C88.6301 19.5934 79.2224 16.0801 58.6844 5.30078C38.1463 16.0801 28.7382 19.5934 5.98368 24.3369C1.86131 100.268 54.7605 126.488 58.6844 128.324C62.6083 126.488 115.507 100.268 111.385 24.3369Z" stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}