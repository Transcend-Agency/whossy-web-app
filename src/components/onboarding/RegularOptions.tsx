import React from "react";

interface RegularOptionsProps {
  desc: string;
  index: number;
  onclick?: () => void;
  active: number | null;
}

const RegularOptions: React.FC<RegularOptionsProps> = ({
  desc,
  index,
  onclick,
  active,
}) => {
  return (
    <div
      className={`onboarding-page__regular-options-container__regular-options ${
        active === index &&
        "onboarding-page__regular-options-container__regular-options__active"
      }`}
      key={index}
      onClick={onclick}
    >
      <div className="onboarding-page__regular-options-container__regular-options__sub-container">
        <p className="onboarding-page__regular-options-container__regular-options__text">
          {desc}
        </p>
      </div>
      <div
        className="onboarding-page__regular-options-container__regular-options__radio-button"
        style={{ backgroundColor: active === index ? "#f2243e" : "white" }}
      />
    </div>
  );
};

export default RegularOptions;
