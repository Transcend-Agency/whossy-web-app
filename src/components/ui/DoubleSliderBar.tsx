import * as Slide from "@radix-ui/react-slider";
import { getValue } from "firebase/remote-config";
import { useState } from "react";

interface DoubleSliderBarProps {
  thumbColor: string;
  rangeColor: string;
  trackColor: string;
  getValue: (arr: number[]) => void;
}

const DoubleSliderBar: React.FC<DoubleSliderBarProps> = ({ thumbColor, rangeColor, trackColor, getValue }) => {
  const [value, setValue] = useState<number[]>([20, 50]);
  return (
    <Slide.Root
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        userSelect: "none",
        width: "100%",
        height: "20px",
      }}
      value={value}
      max={100}
      min={18}
      step={1}
      onValueChange={(e) => {
        setValue([e[0], e[1]]);
        getValue([e[0], e[1]]);
      }}
    >
      <Slide.Track
        style={{
          backgroundColor: trackColor,
          position: "relative",
          flexGrow: 1,
          borderRadius: "9999px",
          height: "2px",
        }}
      >
        <Slide.Range
          style={{
            position: "absolute",
            backgroundColor: rangeColor,
            borderRadius: "9999px",
            height: "100%",
          }}
        />
      </Slide.Track>
      <Slide.Thumb
        style={{
          display: "block",
          width: "20px",
          height: "20px",
          backgroundColor: thumbColor,
          boxShadow: "black",
          border: "2px solid #E7E7E7",
          borderRadius: "10px",
          cursor: "pointer",
        }}
        aria-label="Volume"
      />
      <Slide.Thumb
        style={{
          display: "block",
          width: "20px",
          height: "20px",
          backgroundColor: thumbColor,
          boxShadow: "black",
          border: "2px solid #E7E7E7",
          borderRadius: "10px",
          cursor: "pointer",
        }}
        aria-label="Volume"
      />
    </Slide.Root>
  );
};

export default DoubleSliderBar;