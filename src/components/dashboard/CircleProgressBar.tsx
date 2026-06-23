import {FC} from "react";

interface CircleProgressBarProps {
  percentage: number;
  circleWidth: number;
}

const CircleProgressBar: FC<CircleProgressBarProps> = ({ percentage, circleWidth }) => {
  const radius = 45;
  const dashArray = 2 * Math.PI * radius;
  const dashOffset = dashArray - (dashArray * percentage) / 100;

  return (
    <svg
      width={circleWidth}
      height={circleWidth}
      viewBox={`0 0 ${circleWidth} ${circleWidth}`}
    >
      <defs>
        <pattern
          id="imagePattern"
          //   patternUnits="userSpaceOnUse"
          width={"100%"}
          height={"100%"}
          className="transform rotate-90"
        >
          <image
            href="/assets/images/profile/profile-pic.png"
            x="0"
            y="0"
            width={100}
            height={100}
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>
      <circle
        cx={circleWidth / 2}
        cy={circleWidth / 2}
        strokeWidth={"4px"}
        r={radius}
        fill="url(#imagePattern)"
        className=" stroke-[#D9D9D9] flex items-center justify-center"
      />
      <circle
        cx={circleWidth / 2}
        cy={circleWidth / 2}
        strokeWidth={"4px"}
        r={radius}
        fill="url(#imagePattern)"
        className=" stroke-[#F2243E] flex items-center justify-center"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${circleWidth / 2} ${circleWidth / 2})`}
      />
    </svg>
  );
};

export default CircleProgressBar;
