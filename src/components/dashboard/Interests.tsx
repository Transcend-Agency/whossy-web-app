import React, { useState } from "react";
import { doubleArrowUp, shapes } from "@/assets/icons";
import Icon from "../ui/Icon";

interface InterestProps {
  interestsFromFirebase: string[];
  getState: (state: boolean) => void;
}

const Interests: React.FC<InterestProps> = ({
  interestsFromFirebase,
  getState,
}) => {
  const [click, setClick] = useState(false);
  return (
    <div className="flex relative  px-[1.6rem] py-[1rem]">
      <Icon src={shapes} color="white" />
      <section className="w-full gap-y-2 ">
        {interestsFromFirebase.map((item) => (
          <p className="bg-[#101010] inline-block mr-2 mb-2  py-[6px] px-[8px] text-[1.2rem] text-[#8A8A8E] w-fit rounded-[8px]">
            {item}
          </p>
        ))}
      </section>
      <Icon
        color="white"
        style={{ transform: !click ? "rotate(180deg)" : "" }}
        onClick={() => {
          setClick(!click);
          getState(click);
        }}
        className="absolute right-6 bottom-4 cursor-pointer transition duration-1000 ease-in-out"
        src={doubleArrowUp}
      />
    </div>
  );
};

export default Interests;
