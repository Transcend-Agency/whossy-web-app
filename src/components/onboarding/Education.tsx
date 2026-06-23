import Button from "../ui/Button";
import OnboardingBackButton from "./OnboardingBackButton";
import Skip from "./Skip";
import { OnboardingProps } from "@/types/onboarding.ts";
import OnboardingPage from "./OnboardingPage";
import { useOnboardingStore } from "../../store/OnboardingStore";
import React, { useEffect, useState } from "react";
import { education } from "@/constants";

const Education: React.FC<OnboardingProps> = ({ advance, goBack }) => {
  const { updateOnboardingData, "onboarding-data": data } =
    useOnboardingStore();

  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (data.education !== null && data.education !== undefined) {
      setSelected(data.education);
    }
  }, []);

  return (
    <OnboardingPage>
      <Skip advance={advance} />
      <h1 className="onboarding-page__header">Is education your thing?</h1>
      <p className="onboarding-page__text">
        This would be shown on your profile
      </p>
      {/* <EnterSchoolNameInput getSchool={(e) => setSchool(e)} /> */}
      <div className="my-8 flex gap-x-4">
            {education.map((item, i) => <div key={i} className={` ${selected === i ? "bg-black text-white" : "bg-[#F6F6F6] text-black"} text-[1.8rem] px-6 py-3 w-fit rounded-lg cursor-pointer`} onClick={() => setSelected(i)}>{item}</div>)}
     </div>
      <div className="onboarding-page__section-one__buttons cursor-pointer">
        <OnboardingBackButton onClick={goBack} />
        <Button
          text="Continue"
          onClick={() => {
            advance();
            updateOnboardingData({ education: selected });
          }}
        />
      </div>
    </OnboardingPage>
  );
};

export default Education;
