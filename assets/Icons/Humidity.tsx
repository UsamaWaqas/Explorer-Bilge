import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
}

export default function Humidity({ size = 40, color = "#2C64B3" }: Props) {
  return (
    <Svg viewBox="0 0 88 119" fill="none" width={size} height={size}>
      <Path
        d="M34.5311 92.3174L19.5145 65.7861L4.46668 92.1909C0.173428 100.484 3.41592 110.688 11.7094 114.981C20.0025 119.274 30.2061 116.032 34.4994 107.738C37.0232 102.863 37.0232 97.0659 34.4994 92.1909L34.5311 92.3174Z"
        stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M83.7444 83.6733L68.6966 57.2686L53.6482 83.6733C49.355 91.9668 52.5979 102.17 60.8914 106.463C69.1849 110.757 79.3882 107.514 83.6814 99.2202C86.2049 94.3452 86.2049 88.5483 83.6814 83.6733H83.7444Z"
        stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M59.0433 28.8442L43.995 2.43945L28.9471 28.8442C24.6539 37.1377 27.8964 47.341 36.1898 51.6343C44.4833 55.9275 54.6866 52.685 58.9799 44.3916C61.5036 39.5166 61.5036 33.7192 58.9799 28.8442H59.0433Z"
        stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}