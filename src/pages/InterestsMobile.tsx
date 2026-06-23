import Habits from "@/components/dashboard/Habits";
import { motion } from "framer-motion";

interface InterestsProps {
    activePage: boolean;
    closePage: () => void
}

// type SettingsModal = 'hidden' | 'name' | 'gender' | 'email' | 'phone' | 'relationship-preference' | 'love-language' | 'zodiac' | 'future-family-plans' | 'smoker' | 'religion' | 'drinking' | 'workout' | 'pet' | 'marital-status' | 'height' | 'weight' | 'education'

const InterestsMobile: React.FC<InterestsProps> = ({ activePage, closePage }) => {

    return (
        <>
            <motion.div
                animate={activePage ? { x: "-100%", opacity: 1 } : { x: 0 }} transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page preview-profile settings-page lg:hidden">
                {/* <div className="settings-page__container sticky top-0 z-50">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" />
                            <p>Interests</p>
                        </button>
                        <button className="settings-page__title__save-button">Save</button>
                    </div>
                </div> */}

                
                <Habits path="filters" closePage={closePage}/>
            </motion.div>
        </>
    )
}

export default InterestsMobile;