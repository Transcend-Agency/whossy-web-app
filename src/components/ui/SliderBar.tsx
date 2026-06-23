import * as Slide from "@radix-ui/react-slider";
import React, { useEffect, useState } from "react";

interface SliderBarProps {
  getValue: (value: number) => void;
  rangeColor?: string;
  trackColor?: string;
  thumbColor?: string;
  min?: number;
  max?: number;
  val?:number;
}

const SliderBar: React.FC<SliderBarProps> = ({
  getValue,
  min = 1,
  max=100,
  rangeColor = '#C5C5C7',
  trackColor = '#ffffff',
  thumbColor = '#ffffff',
  val = 0,
}) => {
  const [value, setValue] = useState<number | undefined>(val);
  useEffect(() => {
    setValue(val)
  }, [val])
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
      value={[value as number]}
      max={max}
      min={min}
      step={1}
      onValueChange={(e) => {
        setValue(e[0]);
        getValue(e[0]);
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
    </Slide.Root>
  );
};

export default SliderBar;
