import { motion } from "framer-motion";
import {FC, useEffect, useState} from "react";
import SettingsToggleItem from "../../components/dashboard/SettingsToggleItem";
import ProfileSettingsGroup from "@/components/dashboard/ProfileSettingsGroup";
import SettingsModal from "@/components/dashboard/SettingsModal";
import { useNavigate } from "react-router-dom";
import {auth, functions, googleProvider } from "@/firebase";
import { useAuthStore } from "@/store/UserId";
import { updateUserProfile } from "@/hooks/useUser";
import HelpModal from "@/components/dashboard/HelpModal";
import BlockedContacts from "@/pages/dashboard/BlockedContacts.tsx";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, reauthenticateWithPopup } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import DeleteAccountModal from "@/components/dashboard/DeleteAccountModal.tsx";
import {FaceVerificationModal} from "@/components/dashboard/FaceVerificationModal.tsx";

interface ProfileSettingsProps {
    activePage: boolean;
    closePage: () => void;
    userSettings: {
        incoming_messages?: boolean;
        public_search?: boolean;
        read_receipts?: boolean;
        online_status?: boolean;
    }
    prefetchUserData: () => void;
    userShouldRetakePhoto: boolean;
}

const ProfileSettings: FC<ProfileSettingsProps> = ({ activePage, closePage, userSettings, prefetchUserData, userShouldRetakePhoto}) => {
    const [profileSettings, setProfileSettings] = useState(userSettings);
    const [showBlockedContacts, setShowBlockedContacts] = useState(false);
    const [showModal, setShowModal] = useState<'hidden' | 'logout'>('hidden');
    const [openModal, setOpenModal] = useState(false);
    const [openFaceVModal, setOpenFaceVModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const { reset, auth: user, user: currentUser } = useAuthStore();
    const navigate = useNavigate();

    const updateUserSetting = async (settingName: string, value: boolean) => {
        setProfileSettings(prev => {
            const updatedSettings = { ...prev, [settingName]: value };
            return updatedSettings;
        });

        try {
            // Most accounts have no incoming_messages setting, so it arrives
            // here as undefined, which Firestore refuses to write.
            const updatedSettings = Object.fromEntries(
                Object.entries({ ...profileSettings, [settingName]: value }).filter(([, v]) => v !== undefined)
            );
            // Only user_settings: `currentUser` is a login-time snapshot, and
            // writing it back reverts server-managed fields like credit_balance.
            await updateUserProfile("users", user?.uid as string, prefetchUserData, {
                user_settings: updatedSettings,
            });
        } catch (err) {
            toast.error("Error updating setting");
            console.error("Error updating setting:", err);
            setProfileSettings(prev => ({ ...prev, [settingName]: !value })); // Rollback
        }
    };

    useEffect(() => {
        setProfileSettings(userSettings);
    }, [userSettings]);

    const logout = () => {
        auth.signOut().then(
            () => { console.log('signed out'); reset(); navigate('/')}
        ).catch((err) =>{
            console.log("An error occurred while trying to logout", err); toast.error("Error Logging out")
        })
    }

    // Confirms it is really the account owner before anything is deleted.
    // The server refuses a deletion unless the sign-in is recent, so each
    // provider proves itself the way it signed in.
    const reauthenticate = async (password: string) => {
        const user = getAuth().currentUser;
        if (!user) throw new Error("No user is logged in.");

        if (currentUser?.auth_provider === 'local') {
            await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email as string, password));
        } else if (currentUser?.auth_provider === 'google') {
            await reauthenticateWithPopup(user, googleProvider);
        }
        // Phone sign-ins cannot be re-confirmed in place; the server check
        // below sends those users to sign in again if their session is old.
        await user.getIdToken(true);
    };

    const deleteAccount = async (password: string) => {
        try {
            await reauthenticate(password);
        } catch (error: unknown) {
            const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
            toast.error(code === "auth/wrong-password" || code === "auth/invalid-credential"
                ? "Incorrect password. Please try again."
                : "We couldn't confirm it's you. Please try again.");
            return;
        }

        try {
            await httpsCallable(functions, 'deleteAccount')();
        } catch (error) {
            console.error("Error during account deletion:", error);
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message.includes("RECENT_LOGIN_REQUIRED")
                ? "For your security, log out, sign in again, then delete your account."
                : "We couldn't delete your account. Nothing was removed; please try again.");
            return;
        }

        await auth.signOut().catch(() => undefined);
        reset();
        clearCookiesAndStorage();
        toast.success("Your account has been deleted.");
        navigate("/auth")
    };

    const clearCookiesAndStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((cookie) => {
            const cookieName = cookie.split("=")[0].trim();
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        });
        console.log("Cookies and local storage cleared.");
    };

    return (
        <>
            <SettingsModal show={showModal == 'logout'} onCloseModal={() => setShowModal('hidden')} onLogout={logout}/>
            <HelpModal show={openModal} onCloseModal={() => setOpenModal(false)} />
            <DeleteAccountModal show={deleteModal} onCloseModal={() => setDeleteModal(false)} onDeleteAccount={deleteAccount} passwordRequired={currentUser?.auth_provider === 'local'} />
            <FaceVerificationModal show={openFaceVModal} onCloseModal={() => setOpenFaceVModal(false)} refetchUserData={prefetchUserData} mainPhoto={currentUser?.photos?.[0]} />

            <motion.div animate={activePage ? { x: "-100%", opacity: 1 } : { x: 0 }} transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page edit-profile settings-page z-20">
                <div className="settings-page__container">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={''} />
                            <p>Profile Settings</p>
                        </button>
                    </div>
                    <div className="settings-page__settings-group">
                        {/*<SettingsToggleItem*/}
                        {/*    title="Incoming messages"*/}
                        {/*    subtext="This will allow only verified users to message you."*/}
                        {/*    isActive={profileSettings.incoming_messages as boolean}*/}
                        {/*    onButtonToggle={() => {*/}
                        {/*        const updatedValue = !profileSettings.incoming_messages;*/}
                        {/*        setProfileSettings({*/}
                        {/*            ...profileSettings,*/}
                        {/*            incoming_messages: updatedValue,*/}
                        {/*        });*/}
                        {/*        updateUserSetting('incoming_messages', updatedValue);*/}
                        {/*    }}*/}
                        {/*    isPremium={!currentUser?.is_premium as boolean} />*/}

                        <SettingsToggleItem title="Public search" subtext="Other users will be able to find your profile online when they search the internet." isActive={profileSettings.public_search as boolean}
                        onButtonToggle={() => {
                            const updatedValue = !profileSettings.public_search;
                            setProfileSettings({
                                ...profileSettings,
                                public_search: updatedValue,
                            });
                            updateUserSetting('public_search', updatedValue);
                        }}
                        />

                        <SettingsToggleItem title="Read receipts" subtext="Matches won’t be able to see when you have read their messages and you won’t be able to see theirs." isActive={profileSettings.read_receipts as boolean} onButtonToggle={() => {
                            const updatedValue = !profileSettings.read_receipts;
                            setProfileSettings({
                                ...profileSettings,
                                read_receipts: updatedValue,
                            });
                            updateUserSetting('read_receipts', updatedValue);
                        }} />

                        <SettingsToggleItem title="Online status" subtext="Users won’t be able to see when you’re online." isActive={profileSettings.online_status as boolean} onButtonToggle={() => {
                            const updatedValue = !profileSettings.online_status;
                            setProfileSettings({
                                ...profileSettings,
                                online_status: updatedValue,
                            });
                            updateUserSetting('online_status', updatedValue);
                        }} isPremium={!currentUser?.is_premium as boolean} />

                    </div>

                    <section className="mt-2 space-y-2 flex flex-col">
                        <button onClick={() => setShowBlockedContacts(true)}>
                            <ProfileSettingsGroup title="Blocked contacts"/>
                        </button>
                        <button onClick={() => setOpenModal(true)}>
                            <ProfileSettingsGroup title="Help and Support"/>
                        </button>
                        {userShouldRetakePhoto && <button onClick={() => setOpenFaceVModal(true)}>
                            <ProfileSettingsGroup title="Take Verification Photo"/>
                        </button>}
                    </section>

                    <div
                        className="flex mt-8 justify-center px-[2.8rem] gap-x-2 py-[1.6rem] cursor-pointer bg-[#F6F6F6] hover:bg-[#ececec]"
                        onClick={() => setShowModal('logout')}>
                        <img src="/assets/icons/logout.svg" alt="" />
                        <p>Logout</p>
                    </div>
                    <div onClick={() => {
                        setDeleteModal(true)
                        console.log(deleteModal)
                    }} className="flex mt-8 gap-x-2 justify-center cursor-pointer px-[2.8rem] py-[1.6rem] bg-[#F6F6F6] text-[#F2243E] hover:bg-[#ececec] items-center">
                        <img className={`size-[20px]`} src="/assets/icons/danger.svg" alt=""/>
                        <p>Delete Account</p>
                    </div>
                </div>
            </motion.div>

            <BlockedContacts
                activePage={showBlockedContacts}
                closePage={() => setShowBlockedContacts(false)}
            />
        </>
    )
}

export default ProfileSettings;