import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
  className?: string;
  color?: string;
}

export default function Location({
  className = "w-3 h-fit",
  color = "#828587",
}: Props) {
  return (
    <Svg viewBox="0 0 31 41" fill="none" className={className}>
      <Path
        d="M15.5471 0.587891C7.24815 0.587891 0.458496 6.88522 0.458496 14.5825C0.458496 25.0784 15.5471 40.5723 15.5471 40.5723C15.5471 40.5723 30.6353 25.0784 30.6353 14.5825C30.6353 6.88522 23.8461 0.587891 15.5471 0.587891ZM15.5471 19.5803C12.5297 19.5803 10.1582 17.3811 10.1582 14.5825C10.1582 11.784 12.5297 9.58447 15.5471 9.58447C18.5645 9.58447 20.9358 11.784 20.9358 14.5825C20.9358 17.3811 18.5645 19.5803 15.5471 19.5803Z"
        fill={color}
      />
    </Svg>
  );
}