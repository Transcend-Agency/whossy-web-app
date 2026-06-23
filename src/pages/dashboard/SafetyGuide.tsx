import { motion } from 'framer-motion';
import React, { useState } from 'react';

type SafetyGuideProps = {
    activePage: string;
    activeSubPage: number;
    closePage: () => void;
    onSafetyItem: () => void;
    setActiveSubPage: (num: number) => void;
};

interface SafetyGuideItemProps {
    icon?: string;
    title: string;
    onClick?: () => void
}
const SafetyGuideItem: React.FC<SafetyGuideItemProps> = ({ icon, title, onClick }) => {
    return (
        <div onClick={onClick} className='safety-guide-item'>
            <div className='safety-guide-item__left'>
                <img className='safety-guide-item__image' src={icon} alt={``} />
                <p>{title}</p>
            </div>
            <img className='safety-guide-item__arrow-right' src="/assets/icons/back-arrow-black.svg" alt={``}/>
        </div>
    )
}

interface SafetyItemPageProps {
    activePage?: string;
    activeSubPage?: number;
    closePage?: () => void;
    onSafetyItem?: () => void;
    data?: { title: string; image?: string; points: { title: string; text: string }[] };
}
const SafetyItemPage: React.FC<SafetyItemPageProps> = ({ activePage, activeSubPage, closePage, data }) => {
    return (
        <motion.div
            animate={activePage === 'safety-guide' ? (activeSubPage == 1 ? { x: "-100%", opacity: 1 } : { x: 0 }) : { x: 0 }}
            transition={{ duration: 0.25 }}
            className='dashboard-layout__main-app__body__secondary-page safety-item-page settings-page'
        >
            <div className="settings-page__container">
                <figure className='top-header'>
                    <button onClick={closePage} className="back-button">
                        <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``} />
                    </button>
                    <img src={data?.image} alt={``} />
                </figure>
                <div className="content">
                    <p className='content__header'>
                        {data?.title}
                    </p>
                    {data?.points.map((point, index) => {
                        console.log(data.title)
                        return (< div className="content__item">
                            <p className='content__item-title'><span className='content__item-number'>{data?.title !== 'FAQs' ? index + 1 : 'Q'}.</span>{point.title}</p>
                            <p className='content__item-text'>{point.text}</p>
                        </div>)
                    }
                    )
                    }
                </div>
            </div>
        </motion.div>
    )
}

const SafetyGuide: React.FC<SafetyGuideProps> = ({ activePage, activeSubPage, closePage, onSafetyItem, setActiveSubPage }) => {
    const safetyGuideInformation = {
        'general-safety-tips': {
            title: 'General Safety Tips',
            image: '/assets/icons/safety-item-page-images/general-safety-tips.png',
            points: [
                {
                    title: 'Trust Your Instincts',
                    text: 'If something feels off, it probably is. Don’t hesitate to stop communicating with someone you feel uncomfortable.'
                },
                {
                    title: 'Stay on the Platform',
                    text: 'Keep all communications within the app until you are comfortable and sure about the person.'
                }
            ]
        },
        'protecting-personal-information': {
            title: 'Protecting Personal Information',
            image: '/assets/icons/safety-item-page-images/protecting-personal-information.png',
            points: [
                {
                    title: 'Keep Personal Details Private',
                    text: 'Avoid sharing your phone number, address, workplace, or other personal details with someone you just met online.'
                },
                {
                    title: 'Use Strong Passwords',
                    text: 'Use a strong password for your dating profile and avoid using the same password across multiple accounts.'
                }
            ]
        },
        'spotting-red-flags': {
            title: 'Spotting Red Flags',
            image: '/assets/icons/safety-item-page-images/spotting-red-flags.png',
            points: [
                {
                    title: 'Inconsistent Information',
                    text: 'Be wary of people who give vague or conflicting information about themselves.'
                },
                {
                    title: 'Pressure for Personal Information',
                    text: 'Be cautious of someone who quickly wants personal details or tries to move the conversation off the app.'
                },
                {
                    title: 'Too Good to Be True',
                    text: 'Be suspicious of overly flattering or seemingly perfect profiles, as they may be fake.'
                },
                {
                    title: 'Requests for Money',
                    text: 'Never send money or financial information to someone you’ve only met online.'
                }
            ]
        },
        'communicating-with-matches': {
            title: 'Communicating with Matches',
            image: '/assets/icons/safety-item-page-images/communicating-with-matches.png',
            points: [
                {
                    title: 'Take Your Time',
                    text: 'There’s no rush to give out your personal information or agree to meet in person. Get to know the person first.'
                },
                {
                    title: 'Be Honest and Clear',
                    text: 'Clearly communicate your boundaries and comfort levels. If someone doesn’t respect them, it’s a red flag.'
                }
            ]
        },
        'meeting-in-person': {
            title: 'Meeting in Person',
            image: '/assets/icons/safety-item-page-images/meeting-in-person.png',
            points: [
                {
                    title: 'Meet in a Public Place',
                    text: 'Always meet in a well-lit, public location. Avoid secluded areas or meeting at your home.'
                },
                {
                    title: 'Tell Someone',
                    text: 'Inform a friend or a family member about your plans, including who you’re meeting, where, and when.'
                },
                {
                    title: 'Arrange Your Own Transportation',
                    text: 'Don’t rely on your date for transportation. Have a plan to get home safely on your own.'
                },
                {
                    title: 'Stay Sober',
                    text: 'Avoid excessive alcohol or drug use during your first meetings, as it can impair your judgement and safety.'
                }
            ]
        },
        'reporting-and-blocking': {
            title: 'Reporting and Blocking',
            image: '/assets/icons/safety-item-page-images/reporting-and-blocking.png',
            points: [
                {
                    title: 'Report Suspicious Behaviour',
                    text: 'Use the reporting feature to alert us of any users who violate our community guidelines or engage in harmful behaviour.'
                },
                {
                    title: 'Block Unwanted Users',
                    text: 'If someone makes you uncomfortable or engages in harassment, block them immediately.'
                },
                {
                    title: 'Contact Support',
                    text: 'Our support team is here to help. If you need assistance or have concerns, don’t hesitate to reach out.'
                }
            ]
        },
        'faqs': {
            title: 'FAQs',
            image: '/assets/icons/safety-item-page-images/faqs.png',
            points: [
                {
                    title: 'How Do I Report a User?',
                    text: 'To report a user, go to profile, click the “Report” button, and follow the instructions.'
                },
                {
                    title: 'Can I Delete My Account if I Feel Unsafe?',
                    text: 'Yes, you can delete your account at any time in the account settings section of the app.'
                },
                {
                    title: 'What Should I Do if Someone Asks for Money?',
                    text: 'Do not send money to anyone you’ve met online. Report the user to our support team immediately.'
                }
            ]
        }
    };
    const [selectedSafetyGuidePage, setSelectedSafetyGuidePage] = useState<keyof typeof safetyGuideInformation>()
    return <>
        <motion.div animate={activePage === 'safety-guide' ? (activeSubPage == 0 ? { x: "-100%", opacity: 1 } : { scale: 1, opacity: 1, x: "-100%" }) : { x: 0 }} transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page safety-guide settings-page">
            <div className="settings-page__container">
                <div className="settings-page__title">
                    <button onClick={closePage} className="settings-page__title__left">
                        <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``} />
                        <p>Safety Guide</p>
                    </button>
                    <img className='safety-guide-icon' src="/assets/icons/safety-guide.svg" alt={``} />
                </div>
                <div className='safety-guide__items'>
                    <SafetyGuideItem title="General Safety Tips" icon="/assets/icons/safety-guide-images/lightbulb.png" onClick={() => { setSelectedSafetyGuidePage('general-safety-tips'); onSafetyItem() }} />
                    <SafetyGuideItem title="Protecting Personal Information" icon="/assets/icons/safety-guide-images/padlock.png" onClick={() => { setSelectedSafetyGuidePage('protecting-personal-information'); onSafetyItem() }} />
                    <SafetyGuideItem title="Spotting Red Flags" icon="/assets/icons/safety-guide-images/red-flag.png" onClick={() => { setSelectedSafetyGuidePage('spotting-red-flags'); onSafetyItem() }} />
                    <SafetyGuideItem title="Communicating with Matches" icon="/assets/icons/safety-guide-images/communication.png" onClick={() => { setSelectedSafetyGuidePage('communicating-with-matches'); onSafetyItem() }} />
                    <SafetyGuideItem title="Meeting in Person" icon="/assets/icons/safety-guide-images/calendar.png" onClick={() => { setSelectedSafetyGuidePage('meeting-in-person'); onSafetyItem() }} />
                    <SafetyGuideItem title="Reporting and Blocking" icon="/assets/icons/safety-guide-images/cancel.png" onClick={() => { setSelectedSafetyGuidePage('reporting-and-blocking'); onSafetyItem() }} />
                    <SafetyGuideItem title="FAQ" icon="/assets/icons/safety-guide-images/faq.png" onClick={() => { setSelectedSafetyGuidePage('faqs'); onSafetyItem() }} />
                </div>
            </div>
        </motion.div >
        <SafetyItemPage data={safetyGuideInformation[selectedSafetyGuidePage as keyof typeof safetyGuideInformation]} activePage={activePage} closePage={() => { setActiveSubPage(0) }} activeSubPage={activeSubPage} onSafetyItem={onSafetyItem} />
    </>
}
export default SafetyGuide;