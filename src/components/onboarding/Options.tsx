import React from "react";

interface OptionsProps {
  image: string;
  title: string;
  desc?: string;
  index: number;
  onclick?: () => void;
  active: number | null | undefined;
  className: string;
}

const Options: React.FC<OptionsProps> = ({
  image,
  title,
  desc,
  index,
  onclick,
  active,
  className,
}) => {
  return (
    <div
      className={`onboarding-page__preferences-container__preferences ${active === index &&
        "onboarding-page__preferences-container__preferences__active"
        }`}
      key={index}
      onClick={onclick}
    >
      <div className="onboarding-page__preferences-container__preferences__sub-container">
        <img className={className} src={image} alt="" />
        <div>
          <h1 className={`onboarding-page__preferences-container__preferences__header ${!desc && 'onboarding-page__preferences-container__preferences__header--without-description'}`}>
            {title}
          </h1>
          <p className="onboarding-page__preferences-container__preferences__text">
            {desc}
          </p>
        </div>
      </div>
      <div
        className="onboarding-page__preferences-container__preferences__radio-button"
        style={{ backgroundColor: active === index ? "#f2243e" : "white" }}
      />
    </div>
  );
};

export default Options;
