import React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
  color?: string;
  size?: number;
}

export default function WaterLeak({
  color = "#2C64B3",
  size = 40,
  ...props
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      {...props}
    >
      <Path
        d="M400 320c0 88.37-55.63 144-144 144s-144-55.63-144-144c0-94.83 103.23-222.85 134.89-259.88a12 12 0 0118.23 0C296.77 97.15 400 225.17 400 320z"
        fill="none"
        stroke={color}
        strokeWidth={32}
        strokeMiterlimit={10}
      />

      <Path
        d="M344 328a72 72 0 01-72 72"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
      />
    </Svg>
  );
}