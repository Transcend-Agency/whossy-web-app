import React, { useEffect, useState } from "react";
import Options from "./Options";
import OnboardingBackButton from "./OnboardingBackButton";
import { OnboardingProps } from "@/types/onboarding.ts";
import OnboardingPage from "./OnboardingPage";
import OnboardingButton from "./OnboardingButton";
import { useOnboardingStore } from "../../store/OnboardingStore";
import { meet } from "@/constants";

const WhoDoYouWantToMeet: React.FC<OnboardingProps> = ({ advance, goBack }) => {
  const [active, setActive] = useState<number | null | undefined>(null);
  const { updateOnboardingData, "onboarding-data": data } =
    useOnboardingStore();
  useEffect(() => {
    if (data["gender-preference"] !== null) {
      setActive(data["gender-preference"]);
    }
  }, []);
  return (
    <OnboardingPage>
      <h1 className="onboarding-page__header">Who do you want to meet?</h1>
      <p className="onboarding-page__text">
        This allows us to suggest the right people for you. You can always
        change this later.
      </p>
      <div className="onboarding-page__preferences-container">
        {meet.map((item, i) => (
          <Options
            image={item.image}
            key={i}
            title={item.title}
            index={i}
            onclick={() => setActive(i)}
            active={active}
            className="onboarding-page__preferences-container__preferences__image__small"
          />
        ))}
      </div>
      <div className="onboarding-page__section-one__buttons">
        <OnboardingBackButton onClick={goBack} />
        <OnboardingButton
          advance={() => {
            if (active !== null) {
              advance();
              updateOnboardingData({ "gender-preference": active });
            }
          }}
          selected={active}
        />
      </div>
    </OnboardingPage>
  );
};

export default WhoDoYouWantToMeet;
