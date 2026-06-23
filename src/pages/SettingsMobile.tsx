import ProfileSettingsGroup from "@/components/dashboard/ProfileSettingsGroup";
import SettingsModal from "@/components/dashboard/SettingsModal";
import SettingsToggleItem from "@/components/dashboard/SettingsToggleItem";
import { auth } from "@/firebase";
import { motion } from "framer-motion";
import React, { useState } from "react";

interface ProfileSettingsProps {
    activePage: boolean;
    closePage: () => void;
}

const SettingsMobile: React.FC<ProfileSettingsProps> = ({ activePage, closePage, }) => {
    const [profileSettings, setProfileSettings] = useState({
        incoming_messages: false,
        hide_verification_badge: false,
        public_search: false,
        read_receipts: false,
        online_status: false,
    })

    const [showModal, setShowModal] = useState<'hidden' | 'logout'>('hidden')
    // const navigate = useNavigate()
    return (
        <>
            <SettingsModal show={showModal == 'logout'} onCloseModal={() => setShowModal('hidden')} onLogout={() => auth.signOut().then(() => { localStorage.clear() }).catch((err) => console.log(err))} />
            <motion.div animate={activePage ? { x: "-100%", opacity: 1 } : { x: 0 }} transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page edit-profile settings-page lg:hidden">
                <div className="settings-page__container">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" />
                            <p>Profile Settings</p>
                        </button>
                        <button className="settings-page__title__save-button">Save</button>
                    </div>
                    <div className="settings-page__settings-group">
                        <SettingsToggleItem title="Incoming messages" subtext="This will allow only verified users to message you." isActive={profileSettings.incoming_messages} onButtonToggle={() => setProfileSettings({ ...profileSettings, incoming_messages: !profileSettings.incoming_messages })} />

                        <SettingsToggleItem title="Hide verification badge" subtext="This will hide the verification badge on your profile." isActive={profileSettings.hide_verification_badge} onButtonToggle={() => setProfileSettings({ ...profileSettings, hide_verification_badge: !profileSettings.hide_verification_badge })} />

                        <SettingsToggleItem title="Public search" subtext="Other users will be able to find your profile online when they search the internet." isActive={profileSettings.public_search} onButtonToggle={() => setProfileSettings({ ...profileSettings, public_search: !profileSettings.public_search })} />

                        <SettingsToggleItem title="Read receipts" subtext="Matches won’t be able to see when you have read their messages and you won’t be able to see theirs." isActive={profileSettings.read_receipts} onButtonToggle={() => setProfileSettings({ ...profileSettings, read_receipts: !profileSettings.read_receipts })} />

                        <SettingsToggleItem title="Online status" subtext="Users won’t be able to see when you’re online." isActive={profileSettings.online_status} onButtonToggle={() => setProfileSettings({ ...profileSettings, online_status: !profileSettings.online_status })} isPremium />
                    </div>
                    <section className="my-3 space-y-3">
                        <ProfileSettingsGroup title="Blocked contacts" />
                        <ProfileSettingsGroup title="Restore Purchases" />
                        <ProfileSettingsGroup title="Whossy Safety Center" />
                        <ProfileSettingsGroup title="Community Rules" />
                        <ProfileSettingsGroup title="Policies" />
                        <ProfileSettingsGroup title="Help and Support" />
                    </section>
                    <div className="flex mt-8 justify-center px-[2.8rem] gap-x-2 py-[1.6rem] cursor-pointer bg-[#F6F6F6] hover:bg-[#ececec]" onClick={() => setShowModal('logout')}>
                        <img src="/assets/icons/logout.svg" alt="" />
                        <p>Logout</p>
                    </div>
                    <div className="flex mt-8 justify-center px-[2.8rem] py-[1.6rem] bg-[#F6F6F6] text-[#F2243E] hover:bg-[#ececec]">Delete Account</div>
                </div>
            </motion.div>
        </>
    )
}

export default SettingsMobile;