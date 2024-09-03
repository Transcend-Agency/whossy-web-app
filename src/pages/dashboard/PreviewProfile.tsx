import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface PreviewProfileProps {
    activePage: boolean;
    closePage: () => void
}

// type SettingsModal = 'hidden' | 'name' | 'gender' | 'email' | 'phone' | 'relationship-preference' | 'love-language' | 'zodiac' | 'future-family-plans' | 'smoker' | 'religion' | 'drinking' | 'workout' | 'pet' | 'marital-status' | 'height' | 'weight' | 'education'

const PreviewProfile: React.FC<PreviewProfileProps> = ({ activePage, closePage }) => {
    const [currentImage, setCurrentImage] = useState(0)
    const profileImages = ["/assets/images/dashboard/sample-person.png", "/assets/images/auth-bg/1.webp", "/assets/images/auth-bg/2.webp", "/assets/images/auth-bg/3.webp", "/assets/images/auth-bg/4.webp", "/assets/images/auth-bg/5.webp"]
    const [expanded, setExpanded] = useState(false)
    const moreDetailsContainer = useRef(null)
    const profileContainer = useRef(null);

    const goToNextPost = () => {
        if (currentImage < profileImages.length - 1) {
            setCurrentImage(value => value + 1)
        }
    }
    const goToPreviousPost = () => {
        if (currentImage > 0) {
            setCurrentImage(value => value - 1)
        }
    }

    useEffect(() => {
        // console.log(moreDetailsContainer)
    }, [expanded])

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
                animate={activePage ? { x: "-100%", opacity: 1 } : { x: 0 }} transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page preview-profile settings-page">
                <div className="settings-page__container">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" />
                            <p>Preview Profile</p>
                        </button>
                        <button className="settings-page__title__save-button">Save</button>
                    </div>
                </div>

                <motion.div initial={{ paddingLeft: '3.2rem', paddingRight: '3.2rem', paddingTop: '2.4rem', paddingBottom: '2.4rem' }} animate={expanded ? { padding: 0, height: '46rem' } : { paddingLeft: '3.2rem', paddingRight: '3.2rem', paddingTop: '2.4rem', paddingBottom: '2.4rem' }} className="preview-profile__profile-container">
                    <motion.div animate={expanded ? { borderRadius: 0, height: '46rem' } : { borderTopRightRadius: '1.42rem', borderTopLeftRadius: '1.42rem', borderBottomRightRadius: '2.84rem', borderBottomLeftRadius: '2.84rem' }} className="preview-profile__card">
                        <figure
                            className="preview-profile__image-bg-container">
                            {/* <div className="preview-profile__image-bg-wrapper">

                            </div> */}
                            {profileImages.map((src, index) =>
                            (
                                <motion.img animate={{ opacity: currentImage == index ? 1 : 0 }} className="preview-profile__profile-image" src={src} />
                            )
                            )}
                        </figure>
                        <div className="preview-profile__overlay">
                            <div onClick={goToPreviousPost} className={`previous-button ${currentImage > 0 && 'clickable'}`}>
                                <button>
                                    <img src="/assets/icons/arrow-right.svg" />
                                </button>
                            </div>
                            <div onClick={goToNextPost} className={`next-button ${currentImage < profileImages.length - 1 && 'clickable'}`}>
                                <button>
                                    <img src="/assets/icons/arrow-right.svg" />
                                </button>
                            </div>
                        </div>
                        <div className="preview-profile__profile-details">
                            <div className="status-row">
                                <div className="active-badge">Active</div>
                                <p className="location">~ 22 miles away</p>
                            </div>
                            <motion.div animate={expanded ? { marginBottom: '2.8rem' } : { marginBottom: '1.2rem' }} className="name-row">
                                <div className="left">
                                    <p className="details">Stephanie, <span className="age">21</span></p>
                                    <img src="/assets/icons/verified.svg" />
                                </div>
                                <AnimatePresence>
                                    {expanded && <motion.img exit={{ opacity: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="contract-icon" onClick={() => {
                                            (profileContainer.current as unknown as {scrollTop: number})!.scrollTop = 0
                                            setExpanded(!expanded)
                                        }} src="/assets/icons/down.svg" />}
                                </AnimatePresence>
                            </motion.div>
                            <motion.div initial={{ height: 'auto' }} animate={expanded ? { height: 0, opacity: 0 } : { height: 'auto' }} ref={moreDetailsContainer} className="more-details">
                                <p className="bio">
                                    I am very excited to meet new people and make friends. Let’s start with that and see where it takes us 🚀
                                </p>
                                <div className="interests-row">
                                    <img src="/assets/icons/interests.svg" />
                                    <div className="interests">
                                        <div className="interest">Travelling</div>
                                        <div className="interest">Travelling</div>
                                        <div className="interest">Travelling</div>
                                        <div className="interest">Travelling</div>
                                        <div className="interest">Travelling</div>
                                        <div className="interest">Travelling</div>
                                        {/* <div className="interest">Travelling</div> */}
                                    </div>
                                    <img onClick={() => {
                                        setExpanded(!expanded)
                                    }} className="expand-profile" src="/assets/icons/down.svg" />
                                </div>
                            </motion.div>
                            <div className="preview-profile__image-counter-container">
                                {profileImages.map((image, index) => (
                                    <div onClick={() => { setCurrentImage(index);  image}} className={`preview-profile__image-counter ${index == currentImage && "preview-profile__image-counter--active"}`}></div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
                <div className="preview-profile__more-details">
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/relationship-preference.svg" />
                            Relationship preference
                        </div>
                        <div className="content-item__value">
                            <img src="/assets/images/onboarding/onboarding-fun.svg" />
                            Just for fun
                        </div>
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/relationship-preference.svg" />
                            Bio
                        </div>
                        <div className="content-item__value">
                            I am very excited to meet new people and make friends. Let’s start with that and see where it takes us 🚀
                        </div>
                    </div>
                    <div className="content-item">
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
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/interests-black.svg" />
                            Interests
                        </div>
                        <div className="content-item__multi-options-container">
                            <div className="content-item__multi-options-container__item">
                                Netflix
                            </div>
                            <div className="content-item__multi-options-container__item">
                                Netflix
                            </div>
                            <div className="content-item__multi-options-container__item">
                                Netflix
                            </div>
                            <div className="content-item__multi-options-container__item">
                                Netflix
                            </div>
                            <div className="content-item__multi-options-container__item">
                                Netflix
                            </div>
                            <div className="content-item__multi-options-container__item">
                                Netflix
                            </div>
                            <div className="content-item__multi-options-container__item">
                                Netflix
                            </div>
                            <div className="content-item__multi-options-container__item">
                                Netflix
                            </div>
                        </div>
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/need-to-know.svg" />
                            Personal habits
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
                    <div className="action-button">
                        <img src="/assets/icons/block.svg" />
                        Block Stephanie
                    </div>
                    <div className="action-button action-button--danger">
                        <img src="/assets/icons/report.svg" />
                        Report Stephanie
                    </div>
                </div>
            </motion.div>
        </>
    )
}

export default PreviewProfile;