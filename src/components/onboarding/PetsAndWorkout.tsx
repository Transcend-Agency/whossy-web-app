import React, { useEffect, useState } from "react";
import Button from "../ui/Button";
import OnboardingBackButton from "./OnboardingBackButton";
import Skip from "./Skip";
import RegularOptions from "./RegularOptions";
import { OnboardingProps } from "@/types/onboarding.ts";
import OnboardingPage from "./OnboardingPage";
import { useOnboardingStore } from "../../store/OnboardingStore";
import { workout } from "@/constants";
import Pets from "./Pets";

const PetsAndWorkout: React.FC<OnboardingProps> = ({ advance, goBack }) => {
  const [active, setActive] = useState<number | null>(null);
  const { updateOnboardingData, "onboarding-data": data } =
    useOnboardingStore();
  useEffect(() => {
    if (
      data["workout-preference"] !== null &&
      data["workout-preference"] !== undefined
    ) {
      setActive(data["workout-preference"]);
    }
  }, []);

  return (
    <OnboardingPage>
      <Skip advance={advance} />
      <h1 className="onboarding-page__header">Do you own any pets?</h1>
      <p className="onboarding-page__text">
        This will be shown on your profile
      </p>
      <Pets />
      <hr style={{ marginTop: "4rem" }} />
      <div className="onboarding-page__regular-options-container">
        <h1 style={{ color: "black", fontSize: "1.8rem", fontWeight: 500 }}>
          Do you work out?
        </h1>
        {workout.map((item, i) => (
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
            updateOnboardingData({ "workout-preference": active });
          }}
        />
      </div>
    </OnboardingPage>
  );
};

export default PetsAndWorkout;
