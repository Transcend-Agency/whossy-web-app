import React, { useEffect, useState } from "react";
import { useOnboardingStore } from "../../store/OnboardingStore";
import OnboardingBackButton from "./OnboardingBackButton";
import OnboardingButton from "./OnboardingButton";
import OnboardingPage from "./OnboardingPage";
import toast from "react-hot-toast";
import { OnboardingProps } from "@/types/onboarding.ts";

const HowOldAreYou: React.FC<OnboardingProps> = ({ advance, goBack }) => {
  const [birth_date, setBirthDate] = useState({ day: "", month: "", year: "" });
  const [active, setActive] = useState<boolean | null | undefined>(null);
  const { updateOnboardingData, "onboarding-data": data } =
    useOnboardingStore();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [toastActive, setToastActive] = useState(false); // To track toast state

  const showErrorToast = (message: string) => {
    if (!toastActive) {
      setToastActive(true);
      // Dismiss any existing toasts
      toast.dismiss();
      toast.error(message);
      setToastActive(false); // Reset state after showing toast
    }
  };

  useEffect(() => {
    if (
      birth_date.day.length > 0 &&
      birth_date.month.length > 0 &&
      birth_date.year.length === 4
    ) {
      if (parseInt(birth_date.year) <= currentYear - 18) {
        setActive(true);
      } else {
        showErrorToast("You must be 18 years or above");
      }
    } else {
      setActive(null);
    }
  }, [birth_date]);

  useEffect(() => {
    if (
      data["date-of-birth"] !== undefined &&
      data["date-of-birth"] !== null &&
      data["date-of-birth"] !== ""
    ) {
      // @ts-expect-error legacy type mismatch
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
          onChange={(e) => {
            const value = e.target.value;
            if (
              /^\d{0,2}$/.test(value) &&
              (value === "" || (Number(value) >= 1 && Number(value) <= 31))
            ) {
              setBirthDate((prev) => ({ ...prev, day: value }));
            } else {
              showErrorToast("Enter a valid day (1 - 31)");
            }
          }}
        />
        <input
          type="text"
          className="onboarding-page__date__input"
          placeholder="MM"
          maxLength={2}
          value={birth_date.month}
          onChange={(e) => {
            const value = e.target.value;
            if (
              /^\d{0,2}$/.test(value) &&
              (value === "" || (Number(value) >= 1 && Number(value) <= 12))
            ) {
              setBirthDate((prev) => ({ ...prev, month: value }));
            } else {
              showErrorToast("Enter a valid month (1 - 12)");
            }
          }}
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
