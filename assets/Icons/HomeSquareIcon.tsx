import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
  className?: string;
  color?: string;
}

export default function HomeSquareIcon({
  className = "w-6 h-5",
  color = "#7B868C",
}: Props) {
  return (
    <Svg
      viewBox="0 0 80 80"
      fill="none"
      className={className}
    >
      <Path
        d="M60.0239 3.1377H20.8726C11.2604 3.1377 3.46826 10.9298 3.46826 20.542V59.6934C3.46826 69.3055 11.2604 77.0977 20.8726 77.0977H60.0239C69.6361 77.0977 77.4282 69.3055 77.4282 59.6934V20.542C77.4282 10.9298 69.6361 3.1377 60.0239 3.1377Z"
        stroke={color}
        strokeWidth={5}
        strokeMiterlimit={10}
      />
    </Svg>
  );
}