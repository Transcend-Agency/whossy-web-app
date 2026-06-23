import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { updateUserProfile } from "@/hooks/useUser";
import {  UserFilters } from "@/types/user";
import { alphabet } from "@/constants";
import { useAuthStore } from "@/store/UserId";
import HabitSearch from "@/components/dashboard/HabitSearch";
import { Oval } from "react-loader-spinner";

interface ProfileSettingsProps {
    activePage: boolean;
    closePage: () => void;
    onInterests: () => void;
    userPreferencesData: UserFilters | undefined;
    refetchUserPreferencesData: () => void;
}



const PreferredInterestsMobile: React.FC<ProfileSettingsProps> = ({ activePage, closePage, userPreferencesData, refetchUserPreferencesData}) => {

    const [mutatedData, setMutatedData] = useState<string[]>(userPreferencesData?.interests || []);

    const {auth} = useAuthStore(); 
    
    const [isLoading, setIsLoading] = useState(false);

    const updateUserPreferences = (s: UserFilters) => {updateUserProfile("filters",auth?.uid as string, () => {refetchUserPreferencesData(); setIsLoading(false)}, s).catch(e => console.error(e))}

    useEffect(() => setMutatedData(userPreferencesData?.interests || []), [userPreferencesData?.interests])


    const handleClick = (option: string) => {
        setMutatedData((prevData) => {
            if (prevData.includes(option)) {
                // If the option is already in the array, remove it
                return prevData.filter(item => item !== option);
            } else {
                // If the option is not in the array, add it
                return [...prevData, option];
            }
        });
    };


    return (
        <>
            <motion.div animate={activePage ? { x: "-100%", opacity: 1 } : { x: 0 }} transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page edit-profile settings-page lg:hidden">
            <div className="settings-page__container">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``}/>
                            <p>Interests</p>
                        </button>
                        {(JSON.stringify(userPreferencesData?.interests) !== JSON.stringify(mutatedData))&& <button className="settings-page__title__save-button cursor-pointer" onClick={() => {updateUserPreferences({interests: mutatedData}); setIsLoading(true)}}>{!isLoading ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20}/>}</button>}
                    </div>
                    <main className="px-6">
        <HabitSearch initData={mutatedData} setInitData={(arr) => setMutatedData(arr)} />
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
                </div>
            </motion.div>
        </>
    )
}

export default PreferredInterestsMobile;