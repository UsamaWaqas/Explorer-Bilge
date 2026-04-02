import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
  className?: string;
  color?: string;
}

export default function BookIcon({
  className = "w-8 h-10",
  color = "white",
}: Props) {
  return (
    <Svg
      viewBox="0 0 80 116"
      fill="none"
      className={className}
    >
      <Path
        d="M40.6821 46.7866C49.8805 46.7866 57.3374 36.8948 57.3374 24.6929C57.3374 12.4909 49.8805 2.59937 40.6821 2.59937C31.4837 2.59937 24.0269 12.4909 24.0269 24.6929C24.0269 36.8948 31.4837 46.7866 40.6821 46.7866Z"
        stroke={color}
        strokeWidth={5}
        strokeMiterlimit={10}
      />

      <Path
        d="M58.0659 24.7856H22.1558C11.6487 24.7856 3.13086 33.3034 3.13086 43.8105V94.1343C3.13086 104.641 11.6487 113.159 22.1558 113.159H58.0659C68.573 113.159 77.0908 104.641 77.0908 94.1343V43.8105C77.0908 33.3034 68.573 24.7856 58.0659 24.7856Z"
        stroke={color}
        strokeWidth={5}
        strokeMiterlimit={10}
      />
    </Svg>
  );
}