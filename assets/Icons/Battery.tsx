import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
}

export default function Battery({
  size = 40,
  color = "#2E5798",
}: Props) {
  const fillColor = color === "white" ? color : "black";
  const redColor = color === "white" ? color : "#C1272D";

  return (
    <Svg
      viewBox="0 0 141 97"
      fill="none"
      width={size}
      height={size}
    >
      <Path
        d="M138.283 8.39111H2.77148V93.7695H138.283V8.39111Z"
        stroke={color}
        strokeWidth={5}
        strokeMiterlimit={10}
      />
      <Path
        d="M43.0467 43.9336V47.4294H28.8093V43.9336H43.0467Z"
        fill={fillColor}
      />
      <Path
        d="M43.0467 43.9336H43.1948V43.7855H43.0467V43.9336ZM43.0467 47.4294V47.5774H43.1948V47.4294H43.0467ZM28.8093 47.4294H28.6613V47.5774H28.8093V47.4294ZM28.8093 43.9336V43.7855H28.6613V43.9336H28.8093Z"
        fill={color}
      />
      <Path
        d="M103.387 52.2767V34.6424H106.379V52.2767H103.387Z"
        fill={redColor}
      />
      <Path
        d="M35.3994 1.39941H30.8936C29.4414 1.39941 28.2642 2.57667 28.2642 4.02881V7.54932C28.2642 9.00146 29.4414 10.1787 30.8936 10.1787H35.3994C36.8516 10.1787 38.0283 9.00146 38.0283 7.54932V4.02881C38.0283 2.57667 36.8516 1.39941 35.3994 1.39941Z"
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeMiterlimit={10}
      />
      <Path
        d="M107.688 1.39941H103.183C101.731 1.39941 100.554 2.57667 100.554 4.02881V7.54932C100.554 9.00146 101.731 10.1787 107.688 10.1787H107.688C109.141 10.1787 110.318 9.00146 110.318 7.54932V4.02881C110.318 2.57667 109.141 1.39941 107.688 1.39941Z"
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeMiterlimit={10}
      />
    </Svg>
  );
}