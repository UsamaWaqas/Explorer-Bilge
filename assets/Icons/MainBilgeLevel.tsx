import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
}

export default function MainBilgeLevel({ size = 40, color = "#2C64B3" }: Props) {
  return (
    <Svg viewBox="0 0 109 134" fill="none" width={size} height={size}>
      <Path
        d="M67.856 2.98486H42.6904V131.616H67.856V2.98486Z"
        stroke={color} strokeWidth={4} strokeMiterlimit={10}
      />
      {["17.5361", "32.0801", "46.7134", "61.3125", "75.8867", "90.4307", "105.064", "119.663"].map(
        (y, index) => (
          <Path
            key={index}
            d={`M67.856 ${y}H60.2612`}
            stroke={color} strokeWidth={4} strokeMiterlimit={10}
          />
        )
      )}
      <Path
        d="M71.0716 63.9907C71.2553 64.2566 71.4391 64.4673 71.6207 64.7227C77.384 72.7844 83.0891 75.5474 88.1649 75.5474C97.0503 75.5474 103.95 67.2405 105.842 64.7227C105.656 64.4673 105.472 64.2566 105.29 63.9907C104.953 63.4929 104.921 62.6369 105.223 62.0786C105.313 61.9179 105.438 61.8892 105.553 61.8154C105.46 61.876 105.358 61.8625 105.283 61.9785C104.616 62.9819 88.8101 86.219 72.1632 61.9653C72.0874 61.8521 71.9842 61.8705 71.8959 61.8125C71.7992 61.7519 71.7122 61.6519 71.6122 61.6519C71.5055 61.6519 71.4237 61.7545 71.3282 61.8203C71.217 61.8941 71.0886 61.9206 71.0023 62.0786C70.7001 62.6369 70.7345 63.4929 71.0716 63.9907Z"
        fill="#0075BF" stroke={color} strokeWidth={4} strokeMiterlimit={10}
      />
    </Svg>
  );
}