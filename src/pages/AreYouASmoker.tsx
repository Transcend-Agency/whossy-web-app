import OnboardingBackButton from "../components/onboarding/OnboardingBackButton";
import Button from "../components/ui/Button";
import Skip from "../components/onboarding/Skip";
import RegularOptions from "../components/onboarding/RegularOptions";
import React, { useEffect, useState } from "react";
import { OnboardingProps } from "../types/onboarding";
import OnboardingPage from "../components/onboarding/OnboardingPage";
import { useOnboardingStore } from "../store/OnboardingStore";
import { smoking } from "@/constants";

const AreYouASmoker: React.FC<OnboardingProps> = ({ advance, goBack }) => {
  const [active, setActive] = useState<number | null>(null);
  const { updateOnboardingData, "onboarding-data": data } =
    useOnboardingStore();
  useEffect(() => {
    if (
      data["smoking-preference"] !== null &&
      data["smoking-preference"] !== undefined
    ) {
      setActive(data["smoking-preference"]);
    }
  }, []);

  return (
    <OnboardingPage>
      <Skip advance={advance} />
      <h1 className="onboarding-page__header">Are You A Smoker?</h1>
      <p className="onboarding-page__text">
        This would be shown on your profile
      </p>
      <div className="onboarding-page__regular-options-container">
        {smoking.map((item, i) => (
          <RegularOptions
            key={i}
            desc={item}
            index={i}
            active={active}
            onclick={() => setActive(i)}
          />
        ))}
      </div>
      <div className="onboarding-page__section-one__buttons">
        <OnboardingBackButton onClick={goBack} />
        <Button
          text="Continue"
          onClick={() => {
            advance();
            updateOnboardingData({
              "smoking-preference": active,
            });
          }}
        />
      </div>
    </OnboardingPage>
  );
};

export default AreYouASmoker;
