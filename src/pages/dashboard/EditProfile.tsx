import { motion } from "framer-motion";
import React, { useState } from "react";
import { BioSettingsModal, DrinkingSettingsModal, EducationSettingsModal, EmailSettingsModal, FutureFamilyPlansSettingsModal, GenderSettingsModal, HeightSettingsModal, LoveLanguageSettingsModal, MaritalStatusSettingsModal, NameSettingsModal, PetsSettingsModal, PhoneNumberSettingsModal, RelationshipPreferenceSettingsModal, ReligionSettingsModal, SmokerStatusSettingsModal, WeightSettingsModal, WorkoutSettingsModal, ZodiacSignSettingsModal } from "../../components/dashboard/EditProfileModals";
import SettingsGroup from "../../components/dashboard/SettingsGroup";
import Photos from "@/components/dashboard/Photos";
import {
    cmToFeetAndInches,
    drinking,
    education,
    family_goal,
    getFormattedDateFromFirebaseDate, kilogramsToPounds,
    love_language,
    marital_status,
    pets,
    preference,
    religion,
    smoking,
    workout,
    zodiac
} from "@/constants";
import { updateUserProfile } from "@/hooks/useUser";
import { useAuthStore } from "@/store/UserId";
import { User, UserProfile } from "@/types/user";
import { FaceVerificationModal } from "@/components/dashboard/FaceVerificationModal.tsx";

// Mirrors the mobile app's status label (FaceVerification.getVerificationStatus)
// so the Edit Profile row reads identically across platforms.
const getFaceVerificationLabel = (fv?: User["face_verification"]): string => {
    if (!fv) return "Not Complete";
    switch (fv.status) {
        case "approved":
            return "Complete";
        case "rejected":
            return "Not Complete, Declined";
        case "pending_review":
            return "Pending";
    }
    // Fallback for documents written before the `status` field existed.
    if (!fv.photo) return "Not Complete";
    if (fv.retake_photo) return "Not Complete, Declined";
    return "Complete";
};

interface EditProfileProps {
    activePage: string;
    closePage: () => void;
    onPreviewProfile: () => void;
    onInterests: () => void;
    userData: User | undefined;
    refetchUserData: () => void;
    activeSubPage: number;
    setActiveSubPage?: (s: number) => void;
}

type SettingsModal = 'hidden' | 'name' | 'birthday' | 'gender' | 'email' | 'phone' | 'relationship-preference' | 'love-language' | 'zodiac' | 'future-family-plans' | 'smoker' | 'religion' | 'drinking' | 'workout' | 'pet' | 'marital-status' | 'height' | 'weight' | 'education' | 'bio'

const EditProfile: React.FC<EditProfileProps> = ({ activePage, activeSubPage, closePage, onPreviewProfile, userData, refetchUserData, onInterests }) => {
    const [settingsModalShowing, setSettingsModalShowing] = useState<SettingsModal>('hidden')
    const [showFaceVModal, setShowFaceVModal] = useState(false)
    const hideModal = () => setSettingsModalShowing('hidden')

    const { auth } = useAuthStore();

    const updateUser = async (s: UserProfile) => {
        updateUserProfile("users", auth?.uid as string, () => {hideModal(); refetchUserData()}, s)
            .catch(err => console.error(err))
    }

    return (
        <>
            <NameSettingsModal showing={settingsModalShowing === 'name'} hideModal={hideModal} first_name={userData?.first_name as string} last_name={userData?.last_name as string} handleSave={(first_name, last_name) =>
            {updateUser({first_name, last_name}).catch(err => console.error(err) )}} />
            <GenderSettingsModal showing={settingsModalShowing === 'gender'} hideModal={hideModal} userGender={userData?.gender as string} handleSave={gender => updateUser({gender})}/>
            <EmailSettingsModal showing={settingsModalShowing === 'email'} hideModal={hideModal} />
            <PhoneNumberSettingsModal showing={settingsModalShowing === 'phone'} hideModal={hideModal} phone_number={userData?.phone_number as string} handleSave={(phone_number) => updateUser({phone_number})}/>
            <RelationshipPreferenceSettingsModal showing={settingsModalShowing === 'relationship-preference'} hideModal={hideModal} userPreference={userData?.preference as number} handleSave={(preference) => updateUser({preference}) }/>
            <LoveLanguageSettingsModal showing={settingsModalShowing === 'love-language'} hideModal={hideModal} userLoveLanguage={userData?.love_language as number}  handleSave={(love_language) => updateUser({love_language}) }/>
            <ZodiacSignSettingsModal showing={settingsModalShowing === 'zodiac'} hideModal={hideModal} userZodiac={userData?.zodiac as number} handleSave={(zodiac) => updateUser({zodiac}) } />
            <FutureFamilyPlansSettingsModal showing={settingsModalShowing === 'future-family-plans'} hideModal={hideModal} userFamilyGoal={userData?.family_goal as number} handleSave={(family_goal) => updateUser({family_goal}) } />
            <SmokerStatusSettingsModal showing={settingsModalShowing === 'smoker'} hideModal={hideModal} userSmoke={userData?.smoke as number} handleSave={(smoke) => updateUser({smoke}) }/>

            <ReligionSettingsModal showing={settingsModalShowing === 'religion'} hideModal={hideModal} userReligion={userData?.religion as number} handleSave={(religion) => updateUser({religion}) }/>

            <DrinkingSettingsModal showing={settingsModalShowing === 'drinking'} hideModal={hideModal} userDrink={userData?.drink as number} handleSave={(drink) => updateUser({drink}) }/>
            <WorkoutSettingsModal showing={settingsModalShowing === 'workout'} hideModal={hideModal} userWorkout={userData?.workout as number} handleSave={(workout) => updateUser({workout}) } />
            <PetsSettingsModal showing={settingsModalShowing === 'pet'} hideModal={hideModal} userPet={userData?.pets as number} handleSave={(pets) => updateUser({pets}) } />
            <MaritalStatusSettingsModal showing={settingsModalShowing === 'marital-status'} hideModal={hideModal} userMaritalStatus={userData?.marital_status as number}  handleSave={(marital_status) => updateUser({marital_status}) }/>
            <HeightSettingsModal showing={settingsModalShowing === 'height'} hideModal={hideModal} userHeight={userData?.height ? userData?.height as number : 0}  handleSave={(height) => updateUser({height}) }/>
            <WeightSettingsModal showing={settingsModalShowing === 'weight'} hideModal={hideModal} userWeight={userData?.weight ? userData?.weight as number : 0}  handleSave={(weight) => updateUser({weight}) }/>
            <EducationSettingsModal showing={settingsModalShowing === 'education'} hideModal={hideModal} userEducation={userData?.education as number}  handleSave={(education) => updateUser({education}) }/>
            <BioSettingsModal showing={settingsModalShowing === 'bio'} hideModal={hideModal} bio={userData?.bio as string}  handleSave={(bio) => updateUser({bio}) }/>

            <FaceVerificationModal show={showFaceVModal} onCloseModal={() => setShowFaceVModal(false)} refetchUserData={refetchUserData} />

            <motion.div
                animate={activePage == 'edit-profile' ? (activeSubPage == 0 ? { x: "-100%", opacity: 1 } : { scale: 0.9, opacity: 0.3, x: "-100%" }) : { x: 0 }}
                transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page edit-profile settings-page">
                <div className="settings-page__container">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``} />
                            <p>Edit Profile</p>
                        </button>
                    </div>
                    <button onClick={onPreviewProfile} className="settings-page__preview">Preview Profile</button>
                    <Photos refetchUserData={refetchUserData}/>

                    <div className="space-y-3">
                        <SettingsGroup data={[['Name', userData?.first_name as string, () => {setSettingsModalShowing('name')}],
                            // @ts-expect-error legacy type mismatch
                        ['Birthday', userData?.date_of_birth ? getFormattedDateFromFirebaseDate(userData?.date_of_birth) : '', () => {  }],
                        ['Gender', userData?.gender as string, () => {}],
                        ['Email', userData?.email as string,
                            () => { }],
                        ['Phone number', userData?.phone_number as string, () => {
                            setSettingsModalShowing('phone')
                        }],
                        ]} />
                        <SettingsGroup data={[['Photo Verification', getFaceVerificationLabel(userData?.face_verification), () => { setShowFaceVModal(true) }]]}/>
                        <SettingsGroup data={[['Add personalized interests', 'Change', () => {onInterests()}]]}/>
                        <SettingsGroup data={[['Education', education[userData?.education as number], () => {
                            setSettingsModalShowing('education')
                        }],
                        ['Relationship Goals', preference[userData?.preference as number], () => {
                            setSettingsModalShowing('relationship-preference')
                        }],
                        ['Love language', love_language[userData?.love_language as number], () => {
                            setSettingsModalShowing('love-language')
                        }],
                        ['Zodiac', zodiac[userData?.zodiac as number], () => {
                            setSettingsModalShowing('zodiac')
                        }],
                        ['Future family plans', family_goal[userData?.family_goal as number], () => {
                            setSettingsModalShowing('future-family-plans')
                        }],
                        ['Height', userData?.height ? `${(userData?.height as number)?.toString()}cm (${cmToFeetAndInches(userData?.height as number)})` : 'Choose', () => {
                            setSettingsModalShowing('height')
                        }],
                        ['Weight', userData?.weight ? `${(userData?.weight as number)?.toString()}kg (${kilogramsToPounds(userData?.weight as number)}lbs)` : 'Choose', () => {
                            setSettingsModalShowing('weight')
                        }],
                        ['Religion', religion[userData?.religion as number], () => {
                            setSettingsModalShowing('religion')
                        }],
                        ['Smoker', smoking[userData?.smoke as number], () => {
                            setSettingsModalShowing('smoker')
                        }],
                        ['Drinking', drinking[userData?.drink as number], () => {
                            setSettingsModalShowing('drinking')
                        }],
                        ['Workout', workout[userData?.workout as number], () => {
                            setSettingsModalShowing('workout')
                        }],
                        ['Pet owner', pets[userData?.pets as number], () => {
                            setSettingsModalShowing('pet')
                        }],
                        ['Marital status', marital_status[userData?.marital_status as number], () => {
                            setSettingsModalShowing('marital-status')
                        }]
                        ]} />
                        <SettingsGroup data={[['About me', userData?.bio as string, () => { setSettingsModalShowing('bio') }],
                        ]} />
                    </div>
                </div>
            </motion.div>
        </>
    )
}

export default EditProfile;