import React, { useEffect, useState } from "react";
import { useOnboardingStore as useStore } from "../../store/OnboardingStore";

interface InterestTagProps {
  text: string;
}

const InterestTag: React.FC<InterestTagProps> = ({ text }) => {
  const [selected, setSelected] = useState<string | null>();
  // const {interests,addInterests, removeInterests} = useOnboardingStore();

  const { removeInterests, addInterests, "onboarding-data": data } = useStore();

  const handleClick = () => {
    if (selected === text) {
      removeInterests(text);
      setSelected(null);
    } else {
      addInterests(text);
      setSelected(text);
    }
  };
  useEffect(() => {
    data.interests?.forEach((interest) => {
      if (interest === text) setSelected(text);
    });
  }, [data.interests]);
  return (
    <div
      className="text-[1.6rem] inline-block mr-[1rem] w-fit rounded-md px-[0.6rem] py-[0.8rem] cursor-pointer transition-all duration-150"
      style={{
        border: selected !== text ? "1px solid #8A8A8E" : "1px solid black",
        backgroundColor: selected !== text ? "white" : "black",
        color: selected !== text ? "#8A8A8E" : "white",
      }}
      onClick={handleClick}
    >
      {text}
    </div>
  );
};

export default InterestTag;
