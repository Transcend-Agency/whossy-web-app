import { useEffect, useState } from "react";
import { useOnboardingStore } from "../../store/OnboardingStore";
import { pets } from "@/constants";

interface PetTagProps {
  text: string;
  index: number;
}

const PetTag: React.FC<PetTagProps> = ({ text, index }) => {
  const [selected, setSelected] = useState<string | null>();

  const { "onboarding-data": data, updateOnboardingData } = useOnboardingStore();

  const handleClick = () => {
    setSelected(text);
    updateOnboardingData({ pets: index });
  };
  useEffect(() => {
    setSelected(data.pets ? pets[data.pets] : null);
  // Seed the local selection from the store once, on mount only. Re-running when
  // the store changes would overwrite what the user has picked on this step.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      className="text-[1.6rem] inline-block mr-[1rem] w-fit rounded-md px-[0.6rem] py-[0.8rem] cursor-pointer transition-all duration-150"
      style={{ border: selected !== text ? "1px solid #8A8A8E" : "1px solid black", backgroundColor: selected !== text ? "white" : "black", color: selected !== text ? "#8A8A8E" : "white",}}
      onClick={handleClick}
    >
      {text}
    </div>
  );
};

export default PetTag;
