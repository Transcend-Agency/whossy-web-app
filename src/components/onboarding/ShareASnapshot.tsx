import { FC, useEffect } from "react";
import {arrayUnion, doc, setDoc, Timestamp, updateDoc} from "firebase/firestore";
import { db } from "@/firebase";
import { useOnboardingStore } from "@/store/OnboardingStore";
import { PictureData, usePhotoStore } from "@/store/PhotoStore";
import { useAuthStore } from "@/store/UserId";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import BigSnapshots from "./BigSnapshots";
import OnboardingBackButton from "./OnboardingBackButton";
import OnboardingPage from "./OnboardingPage";
import SmallSnapshots from "./SmallSnapshots";
import { OnboardingProps } from "@/types/onboarding";
import { AdvancedSearchPreferences } from "@/types/user.ts";

const ShareASnapshot: FC<OnboardingProps> = ({ advance, goBack }) => {
    const { photos, setPhotos, reset: resetPhoto } = usePhotoStore();
    const { updateOnboardingData, "onboarding-data": data } = useOnboardingStore();
    const { auth } = useAuthStore();

    const userSettings = {
        incoming_messages: true,
        public_search: true,
        read_receipts: true,
        online_status: true,
    };

    const uploadToFirestore = async () => {

        if (!auth?.uid) {
            console.error("User ID is undefined. Cannot update Firestore without a valid UID.");
            toast.error("An error occurred. Please try again.");
            return;
        }

        try {
            console.log(auth.uid);
            console.log(data['date-of-birth']);
            const userDocRef = doc(db, "users", auth.uid);

            await updateDoc(userDocRef, {
                bio: data["short-introduction"],
                date_of_birth: data["date-of-birth"],
                distance: data["distance-search"],
                drink: data["drinking-preference"],
                education: data.education,
                interests: data.interests,
                meet: data["gender-preference"],
                pets: data.pets,
                photos: Object.values(photos).filter(value => Boolean(value)),
                preference: data["relationship-preference"],
                smoke: data["smoking-preference"],
                workout: data["workout-preference"],
                uid: auth.uid,
                is_premium: false,
                amount_paid_in_total: {
                    naira: 0,
                    kenyan_shillings: 0
                },
                face_verification:{
                    retake_photo: true,
                    photo: null,
                    updated_at: null
                },
                paystack: {},
                created_at: Timestamp.now(),
                blockedIds: arrayUnion(),
                credit_balance: 0,
                is_banned: false,
                has_completed_onboarding: true,
                user_settings: {
                    ...userSettings
                },
                tour_guide: {
                    explore: false,
                    "swipe-and-match": false,
                    matches: false,
                    chat: true,
                    "user-profile": false,
                    notification: true
                }
            });

            await setDoc(doc(db, "advancedSearchPreferences", auth.uid as string), {
                gender: '',
                age_range: { min: 18, max: 100 },
                country: '',
                relationship_preference: null,
                religion: null,
            } as AdvancedSearchPreferences);

            resetPhoto();
        } catch (error) {
            console.error("Failed to update Firestore document:", error);
            toast.error("Failed to set up profile. Please try again.");
        }
    };

    useEffect(() => {
        const profilePhotoData: string[] = data["photos"] as string[];

        const photoData: PictureData = {
            imageOne: profilePhotoData[0] || null,
            imageTwo: profilePhotoData[1] || null,
            imageThree: profilePhotoData[2] || null,
            imageFour: profilePhotoData[3] || null,
            imageFive: profilePhotoData[4] || null,
            imageSix: profilePhotoData[5] || null,
        };

        setPhotos(photoData);
    }, [data]);

    return (
        <OnboardingPage>
            <section className="max-h-screen overflow-y-scroll mt-4">
                <h1 className="onboarding-page__header">Share a snapshot of you</h1>
                <div className="onboarding-page__text">
                    <p className="w-fit">Add at least 2 recent photos of yourself 🤗</p>
                    <p className="max-w-[400px] w-full mb-20">
                        Hint: Using your best photo could give a great first impression and the beginning of something great.
                    </p>
                </div>
                <BigSnapshots />
                <SmallSnapshots />
            </section>

            <div className="onboarding-page__section-one__buttons">
                <OnboardingBackButton onClick={goBack} />
                <Button
                    text="Continue"
                    onClick={async () => {
                        const validPhotos = Object.values(photos).filter((value) => Boolean(value));

                        if (validPhotos.length >= 2) {
                            uploadToFirestore()
                                .catch((e) => {
                                    toast.error("An error occurred while onboarding")
                                    console.error("Error onboarding user: ", e)
                                });

                                updateOnboardingData({ photos: validPhotos });
                                toast.success("Loading...")
                                advance();
                                resetPhoto();
                        } else {
                            toast.error("Please add at least 2 photos of yourself 🤗");
                        }
                    }}
                />
            </div>
        </OnboardingPage>
    );
};

export default ShareASnapshot;