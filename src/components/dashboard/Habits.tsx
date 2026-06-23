import { alphabet } from "@/constants";
import React, { useEffect, useState } from "react";
import { getUserProfile, updateUserProfile  } from "@/hooks/useUser";
import {UserFilters } from "@/types/user";
import HabitSearch from "./HabitSearch";
import { useAuthStore } from "@/store/UserId";

interface HabitsProps {
  path: string;
  closePage?: () => void;
}

const Habits: React.FC<HabitsProps> = ({ path, closePage }) => {
  const [initData, setInitData] = useState<string[]>([]);
  const [mutatedData, setMutatedData] = useState<string[]>([]);

  const {auth} = useAuthStore();

  const fetchInterests = async () => {
    const userProfile = (await getUserProfile(path as 'filters' | 'users' | 'preferences', auth?.uid as string)) as UserFilters;

    if (userProfile) {
      const interests = userProfile.interests as string[];
      interests && setInitData(interests);
      interests && setMutatedData(interests);
    } else {
      console.log("No user profile data found.");
    }
  };

  useEffect(() => {
    fetchInterests().catch((err) => console.error("An error occurred while fetching interest", err));
  }, [path]);

  const arraysAreEqual = (arr1: string[], arr2: string[]) => {
    if (arr1?.length !== arr2?.length) return false;
    for (let i = 0; i < arr1?.length; i++) {
      if (!arr2?.includes(arr1[i])) return false;
    }
    return true;
  };

  const hasChanged = !arraysAreEqual(initData, mutatedData);

  useEffect(() => {
    console.log(mutatedData);
  }, [mutatedData]);

  const handleUpdate = () => {
    updateUserProfile(path as 'filters' | 'users' | 'preferences', auth?.uid as string, fetchInterests, {
      interests: mutatedData,
    }).catch((err) => console.error("An Error occurred while updating: ", err));
  };

  const handleClick = (option: string) => {
    setMutatedData((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  return (
    <>
       <header className="profile__header">
          <div className="profile__header__name">
          <img src="/assets/icons/left-arrow-black.svg" alt="Back Arrow" />
          <h1 onClick={closePage}>Interests</h1>
          </div>
          {hasChanged && (
          <button className="profile__header__save" onClick={handleUpdate}>
          Save
          </button>
          )}
      </header>
      <main className="px-6">
        <HabitSearch
          initData={mutatedData}
          setInitData={(arr) => setMutatedData(arr)}
        />
        {alphabet.map((item, _) => (
          <div className="mb-[0.8rem]" key={_}>
            <h1 className="text-[1.8rem]">{item.letter.toUpperCase()}</h1>
            <div className="space-y-[1rem]">
              {item.options?.map((option, i) => (
                <div
                  key={i}
                  className="text-[1.6rem] inline-block mr-[1rem] w-fit rounded-md px-[0.6rem] py-[0.8rem] cursor-pointer transition-all duration-150"
                  style={{
                    border: mutatedData?.includes(option)
                      ? "1px solid black"
                      : "1px solid #8A8A8E",
                    backgroundColor: mutatedData?.includes(option)
                      ? "black"
                      : "transparent",
                    color: mutatedData?.includes(option) ? "white" : "black",
                  }}
                  onClick={() => handleClick(option)}
                >
                  {option}
                </div>
              ))}
            </div>
            <hr className="mt-[1.8rem]" />
          </div>
        ))}
      </main>
    </>
  );
};

export default Habits;
