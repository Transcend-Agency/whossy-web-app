import { family_goal, preference } from "@/constants";
import { User } from "@/types/user";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef, useState } from "react";
import {calculateAge} from "@/utils/age.ts";

interface PreviewProfileProps {
    activePage: string;
    closePage: () => void;
    activeSubPage: number;
    setActiveSubPage?: (val: number) => void;
    userData: User | undefined;
}

const PreviewProfile: React.FC<PreviewProfileProps> = ({ activePage, closePage, activeSubPage, userData }) => {
    const [currentImage, setCurrentImage] = useState(0)
    const profileImages = userData?.photos as string[]
    const [expanded, setExpanded] = useState(false)
    const moreDetailsContainer = useRef(null)
    const profileContainer = useRef(null);

    const goToNextPost = () => {
        if (currentImage < profileImages?.length - 1) {
            setCurrentImage(value => value + 1)
        }
    }
    const goToPreviousPost = () => {
        if (currentImage > 0) {
            setCurrentImage(value => value - 1)
        }
    }

    return (
        <>
            <motion.div
                style={expanded ?
                    {
                        overflowY: 'scroll',
                    }
                    :
                    {
                        overflowY: 'hidden',
                    }}
                onAnimationEnd={() => {
                    console.log(expanded)
                }}
                ref={profileContainer}
                animate={activePage === 'edit-profile' ? (activeSubPage == 1 ? { x: "-100%", opacity: 1 } : { x: 0 }) : { x: 0 }}
                transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page preview-profile settings-page">
                <div className="settings-page__container">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``} />
                            <p>Preview Profile</p>
                        </button>
                        {/* <button className="settings-page__title__save-button">Save</button> */}
                    </div>
                </div>

                <motion.div initial={{ paddingLeft: '3.2rem', paddingRight: '3.2rem', paddingTop: '2.4rem', paddingBottom: '2.4rem' }} animate={expanded ? { padding: 0, height: '46rem' } : { paddingLeft: '3.2rem', paddingRight: '3.2rem', paddingTop: '2.4rem', paddingBottom: '2.4rem' }} className="preview-profile__profile-container">
                    <motion.div animate={expanded ? { borderRadius: 0, height: '46rem' } : { borderTopRightRadius: '1.42rem', borderTopLeftRadius: '1.42rem', borderBottomRightRadius: '2.84rem', borderBottomLeftRadius: '2.84rem' }} className="preview-profile__card">
                        <figure
                            className="preview-profile__image-bg-container">
                            {/* <div className="preview-profile__image-bg-wrapper">

                            </div> */}
                            {profileImages?.map((src, index) =>
                            (
                                <motion.img key={index} animate={{ opacity: currentImage == index ? 1 : 0 }} className="preview-profile__profile-image" src={src} />
                            )
                            )}
                        </figure>
                        <div className="preview-profile__overlay">
                            <div onClick={goToPreviousPost} className={`previous-button ${currentImage > 0 && 'clickable'}`}>
                                <button>
                                    <img src="/assets/icons/arrow-right.svg" alt={``} />
                                </button>
                            </div>
                            <div onClick={goToNextPost} className={`next-button ${currentImage < profileImages?.length - 1 && 'clickable'}`}>
                                <button>
                                    <img src="/assets/icons/arrow-right.svg" alt={``} />
                                </button>
                            </div>
                        </div>
                        {/* <div className="bg-red-400 size-[60rem]"></div> */}
                        <div className="preview-profile__profile-details">
                            <div className="status-row">
                                {/* This is the viewer's own profile preview (Edit Profile → Preview), not
                                    another user's card — always-active-for-self is correct here, not the
                                    hardcode C1 fixes elsewhere. See isRecentlyOnline for the real check. */}
                                <div className="active-badge">Active</div>
                                {/* No distance line here — this is the viewer's own preview, and
                                    "distance from yourself" is always 0 and not useful to show
                                    (mobile's equivalent, EditProfileData.distance, is null for the
                                    same reason). */}
                            </div>
                            <motion.div animate={expanded ? { marginBottom: '2.8rem' } : { marginBottom: '1.2rem' }} className="name-row">
                                <div className="left">
                                    <p className="details">{userData?.first_name}, <span className="age">{calculateAge(userData?.date_of_birth) ?? 'NIL'}</span></p>
                                    <img src="/assets/icons/verified.svg" alt={``} />
                                </div>
                                <AnimatePresence>
                                    {expanded && <motion.img exit={{ opacity: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="contract-icon" onClick={() => {
                                            (profileContainer.current as unknown as { scrollTop: number })!.scrollTop = 0
                                            setExpanded(!expanded)
                                        }} src="/assets/icons/down.svg" />}
                                </AnimatePresence>
                            </motion.div>
                            <motion.div initial={{ height: 'auto' }} animate={expanded ? { height: 0, opacity: 0 } : { height: 'auto' }} ref={moreDetailsContainer} className="more-details">
                                {userData?.bio && <p className="bio">
                                    {userData.bio.slice(0, 200)}...
                                </p>}
                                <div className="interests-row">
                                    <img src="/assets/icons/interests.svg" alt={``} />
                                    <div className="interests">
                                        {userData?.interests?.slice(0, 4)?.map((item, i) => <div className="interest" key={i}>{item}</div>)}
                                        {/* <div className="interest">Travelling</div> */}
                                    </div>
                                    <img onClick={() => {
                                        setExpanded(!expanded)
                                    }} className="expand-profile" src="/assets/icons/down.svg" alt={``} />
                                </div>
                            </motion.div>
                            <div className="preview-profile__image-counter-container">
                                {profileImages?.map((_image, index) => (
                                    <div key={index} onClick={() => { setCurrentImage(index); }} className={`preview-profile__image-counter ${index == currentImage && "preview-profile__image-counter--active"}`}></div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
                <div className="preview-profile__more-details">
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/relationship-preference.svg" alt={``}/>
                            Relationship preference
                        </div>
                        <div className="content-item__value">
                            {/* <img src="/assets/images/onboarding/onboarding-fun.svg" /> */}
                            {preference[userData?.preference as number]}
                        </div>
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/relationship-preference.svg" alt={``} />
                            Bio
                        </div>
                        {userData?.bio && <div className="content-item__value">
                            {userData.bio}
                        </div>}
                    </div>
                    {/* <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/about.svg" />
                            About
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Future family goals</p>
                            <p className="content-item__info__text">I want children</p>
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Future family goals</p>
                            <p className="content-item__info__text">I want children</p>
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Future family goals</p>
                            <p className="content-item__info__text">I want children</p>
                        </div>
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/need-to-know.svg" />
                            Need to know
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Future family goals</p>
                            <p className="content-item__info__text">I want children</p>
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Future family goals</p>
                            <p className="content-item__info__text">I want children</p>
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Future family goals</p>
                            <p className="content-item__info__text">I want children</p>
                        </div>
                    </div> */}
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/interests-black.svg" alt={``} />
                            Interests
                        </div>
                        <div className="content-item__multi-options-container">
                            {userData?.interests?.map((item, i) => <div key={i} className="content-item__multi-options-container__item">
                                {item}
                            </div>)}
                        </div>
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/need-to-know.svg" alt={``} />
                            Personal habits
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Future family goals</p>
                            {userData?.family_goal && <p className="content-item__info__text">{family_goal[userData?.family_goal as number]}</p>}
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Weight</p>
                            {userData?.weight ? <p className="content-item__info__text">{userData?.weight}kg</p> : <p className="content-item__info__text">Not specified</p>}
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Height</p>
                            {userData?.height ? <p className="content-item__info__text">{userData.height}cm</p> : <p className="content-item__info__text">Not specified</p>}
                        </div>
                    </div>
                    {/* <div className="action-button">
                        <img src="/assets/icons/block.svg" alt={``}/>
                        Block Stephanie
                    </div>
                    <div className="action-button action-button--danger">
                        <img src="/assets/icons/report.svg" alt={``} />
                        Report Stephanie
                    </div> */}
                </div>
            </motion.div>
        </>
    )
}

export default PreviewProfile;