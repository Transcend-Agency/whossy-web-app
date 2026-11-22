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
        Set how far away someone can be to count as nearby. When you swipe, we
        show people within this distance first, then people further away. The
        "Popular in my area" filter in Explore only shows people within this
        distance. You can change this later in Preferences.
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
