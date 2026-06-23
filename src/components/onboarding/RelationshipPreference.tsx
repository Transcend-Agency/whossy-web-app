import React, { useEffect, useState } from "react";
import Options from "./Options";
import { OnboardingProps } from "@/types/onboarding.ts";
import OnboardingPage from "./OnboardingPage";
import OnboardingButton from "./OnboardingButton";
import { useOnboardingStore } from "../../store/OnboardingStore";
import { relationship_preferences } from "@/constants";

const RelationshipPreference: React.FC<OnboardingProps> = ({ advance }) => {
  const [active, setActive] = useState<number | null | undefined>(null);
  const { updateOnboardingData, "onboarding-data": data } =
    useOnboardingStore();
  useEffect(() => {
    if (data["relationship-preference"] !== null) {
      setActive(data["relationship-preference"]);
    }
  }, []);
  return (
    <OnboardingPage>
      <h1 className="onboarding-page__header">
        Specify your relationship preference
      </h1>
      <p className="onboarding-page__text">
        Everyone has a choice, feel free to choose. You can always change later.
      </p>
      <div className="onboarding-page__preferences-container">
        {relationship_preferences.map((item, i) => (
          <Options
            image={item.image}
            key={i}
            desc={item.desc}
            title={item.title}
            index={i}
            onclick={() => setActive(i)}
            active={active}
            className="onboarding-page__preferences-container__preferences__image "
          />
        ))}
      </div>
      <OnboardingButton
        selected={active}
        advance={() => {
          if (active !== null) {
            updateOnboardingData({ "relationship-preference": active });
            advance();
          }
        }}
      />
    </OnboardingPage>
  );
};

export default RelationshipPreference;
