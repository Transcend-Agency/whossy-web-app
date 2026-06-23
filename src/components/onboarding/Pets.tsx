import { useEffect, useState } from "react";
import { pets } from "@/constants";
import { useOnboardingStore } from "@/store/OnboardingStore";

const Pets = () => {
  const [selectedPet, setSelectedPet] = useState<string | null>(null);

  const {updateOnboardingData, "onboarding-data": data} = useOnboardingStore();

  const handleClick = (pet_name: string) => { 
    setSelectedPet(pet_name);
    updateOnboardingData({ pets: pets.indexOf(pet_name) });
  }

  useEffect(() => {setSelectedPet(data.pets ? pets[data.pets] : "")}, []);
  
  return (
    <div className="space-y-[1rem]">
     {pets.map((pet_name, index) => 
      <div
          className="text-[1.6rem] inline-block mr-[1rem] w-fit rounded-md px-[0.6rem] py-[0.8rem] cursor-pointer transition-all duration-150"
          style={{ border: selectedPet !== pet_name ? "1px solid #8A8A8E" : "1px solid black", backgroundColor: selectedPet !== pet_name ? "white" : "black", color: selectedPet !== pet_name ? "#8A8A8E" : "white",}}
          key={index}
          onClick={() => handleClick(pet_name)}
      > {pet_name} </div> 
      )}
    </div>
  );
};

export default Pets;
