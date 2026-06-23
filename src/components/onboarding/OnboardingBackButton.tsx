import React from "react";

interface OnboardingBackButtonProps {
  onClick?: () => void;
}

const OnboardingBackButton: React.FC<OnboardingBackButtonProps> = ({
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="onboarding-page__section-one__buttons__back-button"
    >
      <img src="/assets/icons/back-arrow-black.svg" alt={``} />
    </div>
  );
};
export default OnboardingBackButton;
