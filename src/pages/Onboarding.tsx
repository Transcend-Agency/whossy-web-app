// import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import RelationshipPreference from "../components/onboarding/RelationshipPreference";
import WhoDoYouWantToMeet from "../components/onboarding/WhoDoYouWantToMeet";
import DistanceSearch from "../components/onboarding/DistanceSearch";
import WhatMakesYouTick from "../components/onboarding/WhatMakesYouTick";
import Education from "../components/onboarding/Education";
import DoYouDrink from "../components/onboarding/DoYouDrink";
import AreYouASmoker from "./AreYouASmoker";
import PetsAndWorkout from "../components/onboarding/PetsAndWorkout";
import ShortIntroduction from "../components/onboarding/ShortIntroduction";
import ShareASnapshot from "../components/onboarding/ShareASnapshot";
import HowOldAreYou from "../components/onboarding/HowOldAreYou";
import { AnimatePresence } from "framer-motion";
import ProgressBarItem from "../components/onboarding/ProgressBarItem";
import {GetPhotoVerified} from "@/components/onboarding/GetPhotoVerified.tsx";
import {TakeASelfie} from "@/components/onboarding/TakeASelfie.tsx";

const Onboarding = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const pageOrder = [
    "relationship-preferences",
    "who-do-you-want-to-meet",
    "how-old-are-you",
    "distance-search",
    "what-makes-you-tick",
    "is-education-your-thing",
    "do-you-drink",
    "are-you-a-smoker",
    "pets-and-workout",
    "short-introduction",
    "snapshot",
      "get-photo-verified",
      "take-a-selfie"
  ];

  const advance = () => {
    setCurrentPage(currentPage + 1);
  };
  const goBack = () => {
    setCurrentPage(currentPage - 1);
  };

  return (
    <>
      <nav>
        <img src={'/assets/icons/whossy-logo.svg'} alt="Logo" className='w-[10rem] mb-[5rem] cursor-pointer' />
      </nav>
      <div className="onboarding-page__progress-bar">
        {pageOrder.map((_page, index) => {
          return (
            <ProgressBarItem key={index} active={index <= currentPage} />
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {pageOrder[currentPage] == "relationship-preferences" && (
          <RelationshipPreference key={"relationship-preferences"} advance={advance} />
        )}
        {pageOrder[currentPage] == "who-do-you-want-to-meet" && (
          <WhoDoYouWantToMeet key={"who-do-you-want-to-meet"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "how-old-are-you" && (
          <HowOldAreYou key={"how-old-are-you"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "distance-search" && (
          <DistanceSearch key={"distance-search"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "what-makes-you-tick" && (
          <WhatMakesYouTick key={"what-makes-you-tick"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "is-education-your-thing" && (
          <Education key={"is-education-your-thing"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "do-you-drink" && (
          <DoYouDrink key={"do-you-drink"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "are-you-a-smoker" && (
          <AreYouASmoker key={"are-you-a-smoker"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "pets-and-workout" && (
          <PetsAndWorkout key={"pets-and-workout"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "short-introduction" && (
          <ShortIntroduction key={"short-introduction"} advance={advance} goBack={goBack} />
        )}
        {pageOrder[currentPage] == "snapshot" && (
          <ShareASnapshot key={"snapshot"} advance={advance} goBack={goBack} />
        )}
          {
              pageOrder[currentPage] == "get-photo-verified" && (
                  <GetPhotoVerified key={"get-photo-verified"} advance={advance} goBack={goBack} />
              )
          }
          {
              pageOrder[currentPage] == "take-a-selfie" && (
                  <TakeASelfie key={"snapshot"} advance={() => console.log("This is the final page")} goBack={goBack} />
              )
          }
      </AnimatePresence>
    </>
  );
};

export default Onboarding;
