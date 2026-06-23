import { useEffect, useState } from "react";
import { alphabet } from "@/constants";
import { useOnboardingStore } from "../../store/OnboardingStore";

const OnboardingSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAlphabet, setFilteredAlphabet] = useState(alphabet);
  const [open, setOpen] = useState(false);

  const [active, setActive] = useState<string[]>([]);
  const {
    removeInterests,
    addInterests,
    "onboarding-data": data,
  } = useOnboardingStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const newFilteredAlphabet = alphabet
      .map((entry) => ({
        ...entry,
        options: entry.options.filter((option) =>
          option.toLowerCase().includes(value)
        ),
      }))
      .filter((entry) => entry.options.length > 0);

    setFilteredAlphabet(newFilteredAlphabet);
    if (value !== "") setOpen(true);
    else setOpen(false);
  };

  useEffect(() => {
    setActive(data.interests as string[]);
  }, [data.interests]);

  return (
    <div className="relative">
      <div className="onboarding-page__section-one__search">
        <img src="/assets/icons/search.svg" alt="" />
        <input
          className="onboarding-page__section-one__search__input"
          placeholder="search"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      {open && (
        <ul className="w-full bg-[#f6f6f6] space-y-4 rounded-[1.2rem] text-white absolute top-24 text-[1.8rem] max-h-[34rem] overflow-y-scroll p-[0.9rem]">
          {filteredAlphabet.map(({ options }) => (
            <ul className=" space-y-4 inline-block">
              {options.map((option, index) => (
                <li
                  className={`cursor-pointer mr-[1.2rem] inline-block rounded-[0.6rem] ${
                    !active.includes(option) ? "bg-white" : "bg-black"
                  } ${
                    !active.includes(option) ? "text-[#8A8A8E]" : "text-white"
                  } p-[0.8rem] hover:border-2 hover:border-black w-fit rounded-[0.6rem]`}
                  key={index}
                  onClick={() => {
                    if (!active.includes(option)) addInterests(option);
                    else if (active.includes(option)) removeInterests(option);
                    // addInterests(option);
                  }}
                >
                  {option}
                </li>
              ))}
            </ul>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OnboardingSearch;
