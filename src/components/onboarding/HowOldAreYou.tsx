import OnboardingBackButton from "./OnboardingBackButton";
import { OnboardingProps } from "../../types/onboarding";
import OnboardingPage from "./OnboardingPage";
import { useEffect, useState } from "react";
import { useOnboardingStore } from "../../store/onboarding/useStore";
import OnboardingButton from "./OnboardingButton";

// import Date from "./Date";

const HowOldAreYou: React.FC<OnboardingProps> = ({ advance, goBack }) => {
  const [birth_date, setBirthDate] = useState({ day: "", month: "", year: "" });
  const [active, setActive] = useState<boolean | null | undefined>(null);
  const { updateOnboardingData, "onboarding-data": data } =
    useOnboardingStore();

  useEffect(() => {
    if (
      birth_date.day.length > 0 &&
      birth_date.month.length > 0 &&
      birth_date.year.length === 4
    )
      setActive(true);
    else {
      setActive(null);
    }
  }, [birth_date]);
  useEffect(() => {
    if (
      data["date-of-birth"] !== undefined &&
      data["date-of-birth"] !== null &&
      data["date-of-birth"] !== ""
    ) {
      const the_date = new Date(data["date-of-birth"]);
      setBirthDate({
        day: (the_date.getDate() - 1).toString(),
        month: (the_date.getMonth() + 1).toString(),
        year: the_date.getFullYear().toString(),
      });
    }
  }, []);
  return (
    <OnboardingPage>
      <h1 className="onboarding-page__header">How old are you?</h1>
      <p className="onboarding-page__text">
        Your age will be displayed alongside your profile excluding your birth
        date and month
      </p>
      <section className="onboarding-page__date">
        <input
          type="text"
          className="onboarding-page__date__input"
          placeholder="DD"
          maxLength={2}
          value={birth_date.day}
          onChange={(e) =>
            setBirthDate((prev) => ({ ...prev, day: e.target.value }))
          }
        />
        <input
          type="text"
          className="onboarding-page__date__input"
          placeholder="MM"
          maxLength={2}
          value={birth_date.month}
          onChange={(e) =>
            setBirthDate((prev) => ({ ...prev, month: e.target.value }))
          }
        />
        <input
          type="text"
          className="onboarding-page__date__input"
          placeholder="YYYY"
          maxLength={4}
          value={birth_date.year}
          onChange={(e) =>
            setBirthDate((prev) => ({ ...prev, year: e.target.value }))
          }
        />
      </section>
      <div className="onboarding-page__section-one__buttons">
        <OnboardingBackButton onClick={goBack} />
        <OnboardingButton
          advance={() => {
            advance();
            updateOnboardingData({
              "date-of-birth": new Date(
                parseInt(birth_date.year),
                parseInt(birth_date.month) - 1,
                parseInt(birth_date.day)
              ),
            });
          }}
          selected={active}
          error="Fill in all input fields"
        />
      </div>
    </OnboardingPage>
  );
};

export default HowOldAreYou;