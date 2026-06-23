import {
  communication_style,
  drinking,
  education,
  family_goal,
  love_language,
  pets,
  preference,
  smoking,
  workout,
  zodiac,
} from "@/constants";
import { UserFilters } from "@/types/user";
import React, { useState } from "react";
import { AnimatePresence, motion as m } from "framer-motion";

interface PreferencesModalProps {
  item: {
    title?: string;
    options?: string[];
    id: string;
  };
  close: () => void;
  mutatedData: UserFilters;
  setMutatedData: (key: string, value: number| undefined | null) => void;
}
const PreferencesModal: React.FC<PreferencesModalProps> = ({
  item,
  close,
  mutatedData,
  setMutatedData,
}) => {
  const getValue = (id: string | undefined): string | null => {
    switch (id) {
      case "preference":
        return preference[mutatedData.preference as number] ?? "choose";
      case "education":
        return education[mutatedData.education as number] ?? "choose";
      case "love_language":
        return love_language[mutatedData.love_language as number] ?? "choose";
      case "zodiac":
        return zodiac[mutatedData.zodiac as number] ?? "choose";
      case "family_goal":
        return family_goal[mutatedData.family_goal as number] ?? "choose";
      case "communication_style":
        return (
          communication_style[mutatedData.communication_style as number] ??
          "choose"
        );
      case "smoke":
        return smoking[mutatedData.smoke as number] ?? "choose";
      case "drink":
        return drinking[mutatedData.drink as number] ?? "choose";
      case "workout":
        return workout[mutatedData.workout as number] ?? "choose";
      case "pet_owner":
        return pets[mutatedData.pets as number] ?? "choose";
      default:
        return "choose";
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: "100%" },
    visible: { opacity: 1, y: "0%", transition: { duration: 0.5 } },
    exit: { opacity: 0, y: "100%", transition: { duration: 1.5 } },
  };

  const [active, setActive] = useState<string | null>(getValue(item.id));

  const arrays = {
    love_language,
    zodiac,
    family_goal,
    preference,
    smoking,
    drinking,
    pets,
    workout,
    education,
  };

  const findValueInArrays = (item: string) => {
    for (const [arrayName, array] of Object.entries(arrays)) {
      const index = array.indexOf(item);
      if (index !== -1) {
        return { array: arrayName, index };
      }
    }
    return null;
  };

  return (
    <AnimatePresence>
      <m.div
        className="bg-white text-black flex-1 fixed w-full bottom-0 z-50"
        style={{
          border: "1px solid",
          borderColor: "transparent",
          borderTopRightRadius: "1.8rem",
          borderTopLeftRadius: "1.8rem",
        }}
        variants={modalVariants}
        initial={"hidden"}
        animate="visible"
        exit="exit"
      >
        <header
          className="text-[1.6rem] flex justify-between p-[1.6rem]"
          style={{ borderBottom: "2px solid #F6F6F6" }}
        >
          <h1>{item.title}</h1>
          {active === getValue(item.id) ? (
            <img
              onClick={close}
              className="cursor-pointer"
              src="/assets/icons/close.svg"
              alt=""
            />
          ) : (
            <p
              className="cursor-pointer"
              onClick={() => {
                setMutatedData(item.id, findValueInArrays(active as string)?.index);
                close();
              }}
            >
              Save
            </p>
          )}
        </header>
        {item.options && (
          <div className=" w-full p-[1.6rem] space-y-[1rem]">
            {item.options.map((option: string, i: number) => (
              <div
                className={`p-[0.8rem] cursor-pointer inline-block mr-[1.6rem] text-[1.4rem] ${
                  option === active
                    ? "bg-black text-white"
                    : "bg-[#F6F6F6] text-[#8A8A8E]"
                }  w-fit rounded-[0.6rem]`}
                key={i}
                onClick={() => {setActive(option)}}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </m.div>
    </AnimatePresence>
  );
};

export default PreferencesModal;
