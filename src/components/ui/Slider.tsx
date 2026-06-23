import * as Slide from "@radix-ui/react-slider";
import React, { useEffect, useState } from "react";
import { useOnboardingStore } from "../../store/OnboardingStore";

interface SliderProps {
  getDistance?: (s: number) => void;
}

const Slider: React.FC<SliderProps> = ({ getDistance }) => {
  const [distance, setDistance] = useState(50);
  const { "onboarding-data": data, updateOnboardingData } =
    useOnboardingStore();

  useEffect(() => {
    if (data["distance-search"]) {
      setDistance(data["distance-search"]);
    }
  }, []);

  return (
    <div className="space-y-[3rem] text-[2.4rem] my-[2rem] flex flex-col items-center">
      <div className="bg-[#CDCDCD] size-[27.2rem] rounded-full flex justify-center items-center">
        <div className="bg-white size-[20.8rem] rounded-full flex justify-center items-center">
          <div className="bg-[#F6F6F6] size-[14.4rem] rounded-full flex justify-center items-center">
            <p className="font-bold">
              {distance} {distance === 1 ? "mile" : "miles"}
            </p>
          </div>
        </div>
      </div>
      <Slide.Root
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          userSelect: "none",
          width: "100%",
          height: "20px",
        }}
        value={[distance]}
        max={100}
        min={1}
        step={1}
        onValueChange={(e) => {
          setDistance(e[0]);
          updateOnboardingData({ "distance-search": e[0] });
          getDistance && getDistance(e[0]);
        }}
      >
        <Slide.Track
          style={{
            backgroundColor: "#D9D9D9",
            position: "relative",
            flexGrow: 1,
            borderRadius: "9999px",
            height: "3px",
          }}
        >
          <Slide.Range
            style={{
              position: "absolute",
              backgroundColor: "#000000",
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
            backgroundColor: "black",
            boxShadow: "black",
            borderRadius: "10px",
            cursor: "pointer",
          }}
          aria-label="Volume"
        />
      </Slide.Root>
    </div>
  );
};

export default Slider;
