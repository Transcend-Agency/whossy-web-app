import React, { FC, useState, useRef } from "react";

interface DateOfBirth {
  day: string;
  month: string;
  year: string;
}

interface DateProps {
  getBirthDate: (date: DateOfBirth) => void;
}
const Date: FC<DateProps> = ({getBirthDate}) => {
  const [dateOfBirth, setDateOfBirth] = useState({
    day: "",
    month: "",
    year: "",
  });
  const dayInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  const handleDayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input.length <= 2) {
      setDateOfBirth((prev) => ({ ...prev, day: input }));
      getBirthDate(dateOfBirth);
      if (input.length === 2 && monthInputRef.current) {
        monthInputRef.current.focus();
      }
    }
  };

  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input.length <= 2) {
      setDateOfBirth((prev) => ({ ...prev, month: input }));
      getBirthDate(dateOfBirth);
      if (input.length === 2 && yearInputRef.current) {
        yearInputRef.current.focus();
      }
    }
    if (input.length === 0 && dayInputRef.current) {
      dayInputRef.current.focus();
    }
  };

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDateOfBirth((prev) => ({ ...prev, year: input }));
    getBirthDate(dateOfBirth);
    if (input.length === 0 && monthInputRef.current) {
      monthInputRef.current.focus();
    }
  };

  return (
    <section className="onboarding-page__date">
      <input
        type="text"
        className="onboarding-page__date__input"
        placeholder="DD"
        value={dateOfBirth.day}
        ref={dayInputRef}
        onChange={handleDayInputChange}
        maxLength={2}
      />
      <input
        type="text"
        className="onboarding-page__date__input"
        placeholder="MM"
        value={dateOfBirth.month}
        ref={monthInputRef}
        onChange={handleMonthInputChange}
        maxLength={2}
      />
      <input
        type="text"
        className="onboarding-page__date__input"
        placeholder="YYYY"
        value={dateOfBirth.year}
        ref={yearInputRef}
        maxLength={4}
        onChange={handleYearInputChange}
        required
      />
    </section>
  );
};

export default Date;
