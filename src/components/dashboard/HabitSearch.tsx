import React, { useEffect, useRef, useState } from "react";
import { alphabet } from "@/constants";

interface HabitProps {
  initData: string[];
  setInitData: (arr: string[]) => void;
}

const HabitSearch: React.FC<HabitProps> = ({ initData, setInitData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAlphabet, setFilteredAlphabet] = useState(alphabet);
  const [open, setOpen] = useState(false);


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

  const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				inputRef.current &&
				!inputRef.current.contains(event.target as Node) &&
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

  const [mutatedData, setMutatedData] = useState<string[]>(initData);

  const handleClick = (option: string) => {
    setMutatedData((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  useEffect(() => {
    setInitData(mutatedData);
  }, [mutatedData]);

  useEffect(() => {
    setMutatedData(initData);
  }, [initData]);
  return (
    <div className="relative">
      <div className="onboarding-page__section-one__search">
        <img src="/assets/icons/search.svg" alt="" />
        <input
          className="onboarding-page__section-one__search__input"
          placeholder="search"
          value={searchTerm}
          onChange={handleSearchChange}
          ref={inputRef}
        />
      </div>
      {open && (
        <ul ref={dropdownRef} className="w-full bg-[#f6f6f6] space-y-4 rounded-[1.2rem] text-white absolute top-24 text-[1.8rem] max-h-[34rem] overflow-y-scroll p-[0.9rem]">
          {filteredAlphabet.length !==0 ? filteredAlphabet.map(({ options }) => (
            <ul className=" space-y-4 inline-block">
              {options.map((option, index) => (
                <li
                  className={`cursor-pointer mr-[1.2rem] inline-block rounded-[0.6rem] ${
                    !mutatedData.includes(option)
                      ? "bg-white text-[#8A8A8E]"
                      : "bg-black text-white"
                  } p-[0.8rem] hover:border-2 hover:border-black w-fit rounded-[0.6rem]`}
                  key={index}
                  onClick={() => handleClick(option)}
                >
                  {option}
                </li>
              ))}
            </ul> 
          )) : <div className="text-red-600">Enter a valid field</div>}
        </ul>
      )}
    </div>
  );
};

export default HabitSearch;
