import OnboardingBackButton from "./OnboardingBackButton";
import Button from "../ui/Button";
import Skip from "./Skip";
import RegularOptions from "./RegularOptions";
import React, { useEffect, useState } from "react";
import { OnboardingProps } from "@/types/onboarding.ts";
import OnboardingPage from "./OnboardingPage";
import { useOnboardingStore } from "../../store/OnboardingStore";
import { drinking } from "@/constants";

const DoYouDrink: React.FC<OnboardingProps> = ({ advance, goBack }) => {
  const [active, setActive] = useState<number | null>(null);
  const { updateOnboardingData, "onboarding-data": data } =
    useOnboardingStore();

  useEffect(() => {
    if (
      data["drinking-preference"] !== null &&
      data["drinking-preference"] !== undefined
    ) {
      setActive(data["drinking-preference"]);
    }
  }, []);

  return (
    <OnboardingPage>
      <Skip advance={advance} />
      <h1 className="onboarding-page__header">Do you drink?</h1>
      <p className="onboarding-page__text">
        This would be shown on your profile
      </p>
      <div className="onboarding-page__regular-options-container">
        {drinking.map((item, i) => (
          <RegularOptions
            key={i}
            desc={item}
            index={i}
            active={active}
            onclick={() => setActive(i)}
          />
        ))}
      </div>
      <div className="onboarding-page__section-one__buttons cursor-pointer">
        <OnboardingBackButton onClick={goBack} />
        <Button
          text="Continue"
          onClick={() => {
            advance();
            updateOnboardingData({
              "drinking-preference": active,
            });
          }}
        />
      </div>
    </OnboardingPage>
  );
};

export default DoYouDrink;
