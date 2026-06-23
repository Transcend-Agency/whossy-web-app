import Button from "../ui/Button";
import OnboardingBackButton from "./OnboardingBackButton";
import { OnboardingProps } from "@/types/onboarding.ts";
import Slider from "../ui/Slider";
import OnboardingPage from "./OnboardingPage";
import React from "react";
const DistanceSearch: React.FC<OnboardingProps> = ({ advance, goBack }) => {

  return (
    <OnboardingPage>
      <h1 className="onboarding-page__header">Distance Search Results</h1>
      <p className="onboarding-page__text">
        Use the slider below to set a radius of how far you want our system to
        search for matches within your current location. You can always change
        this later in the settings.
      </p>
      <Slider />
      <div className="onboarding-page__section-one__buttons">
        <OnboardingBackButton onClick={goBack} />
        <Button
          text="Continue"
          className="cursor-pointer"
          onClick={() => {
            advance();
          }}
        />
      </div>
    </OnboardingPage>
  );
};

export default DistanceSearch;
