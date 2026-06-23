import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { CitySettingsModal, CommunicationSettingsModal, CountrySettingsModal, DietarySettingsModal, DrinkingSettingsModal, EducationSettingsModal, EmailSettingsModal, FutureFamilyPlansSettingsModal, GenderSettingsModal, LoveLanguageSettingsModal, MaritalStatusSettingsModal, NameSettingsModal, PetsSettingsModal, PhoneNumberSettingsModal, RelationshipPreferenceSettingsModal, ReligionSettingsModal, SmokerStatusSettingsModal, WorkoutSettingsModal, ZodiacSignSettingsModal } from "../../components/dashboard/EditProfileModals";
import SettingsGroup from "../../components/dashboard/SettingsGroup";
import SettingsInterest from "@/components/dashboard/SettingsInterests";
import SettingsToggleItem from "@/components/dashboard/SettingsToggleItem";
import DoubleSliderBar from "@/components/ui/DoubleSliderBar";
import SliderBar from "@/components/ui/SliderBar";
import { communication_style, dietary, drinking, education, family_goal, love_language, marital_status, pets, preference, religion, smoking, workout, zodiac } from "@/constants";
import { updateUserProfile } from "@/hooks/useUser";
import { useAuthStore } from "@/store/UserId";
import { User, UserFilters } from "@/types/user";
import { Oval } from "react-loader-spinner";

interface ProfileSettingsProps {
    activePage: boolean;
    closePage: () => void;
    onInterests: () => void;
    userData: User | undefined;
    userFilters: UserFilters | undefined;
    refetchUserData: () => void;
    refetchUserFilters: () => void;
}

type SettingsModal = 'hidden' | 'name' | 'gender' | 'email' | 'phone' | 'relationship-preference' | 'love-language' | 'zodiac' | 'future-family-plans' | 'smoker' | 'religion' | 'drinking' | 'workout' | 'pet' | 'marital-status' | 'height' | 'weight' | 'education' | 'country' | 'city' | 'communication_style' | 'dietary'

const Preferences: React.FC<ProfileSettingsProps> = ({ activePage, closePage, onInterests, userData, userFilters, refetchUserData, refetchUserFilters }) => {
    const [settingsModalShowing, setSettingsModalShowing] = useState<SettingsModal>('hidden')
    const hideModal = () => setSettingsModalShowing('hidden')

    const { auth } = useAuthStore();


    const updateUser = async (s: User) => { updateUserProfile("users", auth?.uid as string, () => {
        hideModal();
        refetchUserData()
    }, s).catch(e => console.error(e)) }
    const updateUserPreferences = async (s: UserFilters) => { updateUserProfile("filters", auth?.uid as string, () => { hideModal(); refetchUserFilters() }, s).catch(e => console.error(e)) }
    const [toggle, setToggle] = useState({ similar_interest: userFilters?.similar_interest, has_bio: userFilters?.has_bio, outreach: userFilters?.outreach })
    const [userValue, setUserValue] = useState({ distance: userFilters?.distance, age_range: userFilters?.age_range })

    useEffect(() => { setToggle({ similar_interest: userFilters?.similar_interest as boolean, has_bio: userFilters?.has_bio as boolean, outreach: userFilters?.outreach as boolean }) }, [userFilters?.similar_interest, userFilters?.has_bio, userFilters?.outreach])
    useEffect(() => { setUserValue({ distance: userFilters?.distance as number, age_range: userFilters?.age_range }) }, [userFilters?.distance, userFilters?.age_range])


    const [isSavingDistance, setIsSavingDistance] = useState(false)
    const [isSavingAge, setIsSavingAge] = useState(false)

    return (
        <>
            <NameSettingsModal showing={settingsModalShowing === 'name'} hideModal={hideModal} first_name={userData?.first_name as string} last_name={userData?.last_name as string} handleSave={(first_name, last_name) => { updateUser({ first_name, last_name }).catch(e => console.error(e)) }} />
            <GenderSettingsModal showing={settingsModalShowing === 'gender'} hideModal={hideModal} userGender={userData?.gender as string} handleSave={(gender) => updateUser({ gender })} />
            <EmailSettingsModal showing={settingsModalShowing === 'email'} hideModal={hideModal} />
            <PhoneNumberSettingsModal showing={settingsModalShowing === 'phone'} hideModal={hideModal} phone_number={userData?.phone_number as string} handleSave={(phone_number) => updateUser({ phone_number })} />
            <RelationshipPreferenceSettingsModal showing={settingsModalShowing === 'relationship-preference'} hideModal={hideModal} userPreference={userFilters?.preference as number} handleSave={(preference) => updateUserPreferences({ preference })} />
            <LoveLanguageSettingsModal showing={settingsModalShowing === 'love-language'} hideModal={hideModal} userLoveLanguage={userFilters?.love_language as number} handleSave={(love_language) => updateUserPreferences({ love_language })} />
            <ZodiacSignSettingsModal showing={settingsModalShowing === 'zodiac'} hideModal={hideModal} userZodiac={userFilters?.zodiac as number} handleSave={(zodiac) => updateUserPreferences({ zodiac })} />
            <FutureFamilyPlansSettingsModal showing={settingsModalShowing === 'future-family-plans'} hideModal={hideModal} userFamilyGoal={userFilters?.family_goal as number} handleSave={(family_goal) => updateUserPreferences({ family_goal })} />
            <CountrySettingsModal showing={settingsModalShowing === 'country'} hideModal={hideModal} preferredCountry={userFilters?.country as string} handleSave={(country) => updateUserPreferences({ country })} />
            <CitySettingsModal showing={settingsModalShowing === 'city'} hideModal={hideModal} preferredCity={userFilters?.city as string} handleSave={(city) => updateUserPreferences({ city })} />
            <CommunicationSettingsModal showing={settingsModalShowing === 'communication_style'} hideModal={hideModal} userCommunicationStyle={userFilters?.communication_style as number} handleSave={(communication_style) => updateUserPreferences({ communication_style })} />
            <SmokerStatusSettingsModal showing={settingsModalShowing === 'smoker'} hideModal={hideModal} userSmoke={userFilters?.smoke as number} handleSave={(smoke) => updateUserPreferences({ smoke })} />
            <ReligionSettingsModal showing={settingsModalShowing === 'religion'} hideModal={hideModal} userReligion={userFilters?.religion as number} handleSave={(religion) => updateUserPreferences({ religion })} />
            <DietarySettingsModal showing={settingsModalShowing === 'dietary'} hideModal={hideModal} preferredDietary={userFilters?.dietary as number} handleSave={(dietary) => updateUserPreferences({ dietary })} />
            <DrinkingSettingsModal showing={settingsModalShowing === 'drinking'} hideModal={hideModal} userDrink={userFilters?.drink as number} handleSave={(drink) => updateUserPreferences({ drink })} />
            <WorkoutSettingsModal showing={settingsModalShowing === 'workout'} hideModal={hideModal} userWorkout={userFilters?.workout as number} handleSave={(workout) => updateUserPreferences({ workout })} />
            <PetsSettingsModal showing={settingsModalShowing === 'pet'} hideModal={hideModal} userPet={userFilters?.pets as number} handleSave={(pets) => updateUserPreferences({ pets })} />
            <MaritalStatusSettingsModal showing={settingsModalShowing === 'marital-status'} hideModal={hideModal} userMaritalStatus={userFilters?.marital_status as number} handleSave={(marital_status) => updateUserPreferences({ marital_status })} />
            <EducationSettingsModal showing={settingsModalShowing === 'education'} hideModal={hideModal} userEducation={userFilters?.education as number} handleSave={(education) => updateUserPreferences({ education })} />
            <motion.div animate={activePage ? { x: "-100%", opacity: 1 } : { x: 0 }} transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page edit-profile settings-page ">
                <div className="settings-page__container">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``} />
                            <p>Preferences</p>
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-[#F6F6F6] py-2">
                            <div className="px-5">
                                <div className="flex justify-between">
                                    <div className="flex gap-x-4 items-center"> <p>Distance Radius</p> <div className="bg-white py-2 px-3 rounded-[4px]">{userValue.distance ?? 0} mi</div></div>
                                    {userValue?.distance !== userFilters?.distance && <button className="modal__body__header__save-button" onClick={() => { setIsSavingDistance(true); updateUserPreferences({ distance: userValue.distance }).catch(e => console.error(e)); setTimeout(() => setIsSavingDistance(false), 1500) }}>{!isSavingDistance ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={14} height={14} />}</button>}
                                </div>
                                <SliderBar val={userValue?.distance} getValue={(val) => setUserValue((prev) => ({ ...prev, distance: val }))} />
                            </div>
                            <SettingsToggleItem title="Show people outside my distance radius and country for better reach" isActive={toggle?.outreach as boolean} onButtonToggle={() => { setToggle((prev) => ({ ...prev, outreach: !toggle.outreach })); updateUserPreferences({ outreach: !userFilters?.outreach }).catch(e => console.error(e)) }} />
                            <div className="px-5 pt-4">
                                <div className="flex justify-between">
                                    <div className="flex gap-x-4 items-center"> <p>Age range</p> <div className="bg-white py-2 px-3 rounded-[4px]">{userValue?.age_range?.min ?? 'NIL'} - {userValue?.age_range?.max ?? "NIL"}</div></div>
                                    {JSON.stringify(userValue?.age_range) !== JSON.stringify(userFilters?.age_range) && <button className="modal__body__header__save-button" onClick={() => { setIsSavingAge(true); updateUserPreferences({ age_range: userValue.age_range }).catch(e => console.error(e)); setTimeout(() => setIsSavingAge(false), 1500)}}>{!isSavingAge ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={14} height={14} />}</button>}
                                </div>
                                <DoubleSliderBar val={[userValue?.age_range?.min as number ?? 18, userValue?.age_range?.max as number ?? 20]} getValue={(val) => setUserValue((prev) => ({ ...prev, age_range: { min: val[0], max: val[1] } }))} />
                            </div>
                        </div>

                        <div>
                            <SettingsToggleItem title="Have a similar interest" isActive={toggle?.similar_interest as boolean} onButtonToggle={() => { setToggle((prev) => ({ ...prev, similar_interest: !toggle.similar_interest })); updateUserPreferences({ similar_interest: !userFilters?.similar_interest }).catch(e => console.error(e)) }} />
                            <SettingsInterest title="Add personalized interests" onButtonPress={onInterests} />
                            <SettingsToggleItem title="Has a bio" isActive={toggle?.has_bio as boolean} onButtonToggle={() => { setToggle((prev) => ({ ...prev, has_bio: !toggle.has_bio })); updateUserPreferences({ has_bio: !userFilters?.has_bio }).catch(e => console.error(e)) }} />
                        </div>
                        <SettingsGroup data={[
                            ['Relationship Preference', preference[userFilters?.preference as number], () => {
                                setSettingsModalShowing('relationship-preference')
                            }],
                            ['Education', education[userFilters?.education as number], () => {
                                setSettingsModalShowing('education')
                            }],
                            ['Love language', love_language[userFilters?.love_language as number], () => {
                                setSettingsModalShowing('love-language')
                            }],
                            ['Zodiac', zodiac[userFilters?.zodiac as number], () => {
                                setSettingsModalShowing('zodiac')
                            }],
                            ['Future family plans', family_goal[userFilters?.family_goal as number], () => {
                                setSettingsModalShowing('future-family-plans')
                            }],
                            ['Country of residence', userFilters?.country, () => {
                                setSettingsModalShowing('country')
                            }],
                            ['City of residence', userFilters?.city, () => {
                                setSettingsModalShowing('city')
                            }],
                            ['How you communicate', communication_style[userFilters?.communication_style as number], () => {
                                setSettingsModalShowing('communication_style')
                            }],
                            ['Religion', religion[userFilters?.religion as number], () => {
                                setSettingsModalShowing('religion'); console.log('religion')
                            }],
                            ['Dietary', dietary[userFilters?.dietary as number], () => {
                                setSettingsModalShowing('dietary')
                            }],
                            ['Smoker', smoking[userFilters?.smoke as number], () => {
                                setSettingsModalShowing('smoker')
                            }],
                            ['Drinking', drinking[userFilters?.drink as number], () => {
                                setSettingsModalShowing('drinking')
                            }],
                            ['Workout', workout[userFilters?.workout as number], () => {
                                setSettingsModalShowing('workout')
                            }],
                            ['Pet owner', pets[userFilters?.pets as number], () => {
                                setSettingsModalShowing('pet')
                            }],
                            ['Marital status', marital_status[userFilters?.marital_status as number], () => {
                                setSettingsModalShowing('marital-status')
                            }]
                        ]} />
                    </div>
                </div>
            </motion.div>
        </>
    )
}

export default Preferences;