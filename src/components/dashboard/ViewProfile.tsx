import ReportModal from "@/components/dashboard/ReportModal.tsx";
import { drinking, education, family_goal, preference, relationship_preferences, religion, smoking, workout } from '@/constants';
import { db } from "@/firebase";
import useSyncUserLikes from "@/hooks/useSyncUserLikes.tsx";
import { useMatchStore } from "@/store/Matches.tsx";
import useDashboardStore from "@/store/useDashboardStore.tsx";
import { useAuthStore } from '@/store/UserId';
import { User } from '@/types/user';
import { getYearFromFirebaseDate } from '@/utils/date';
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { motion, useAnimationControls } from 'framer-motion';
import React, { useEffect, useRef, useState } from "react";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DashboardPageContainer from "./DashboardPageContainer";
import {useChatIdStore} from "@/store/ChatStore.tsx";
import {createOrFetchChat} from "@/utils/chatService.ts";
import {Chat} from "@/types/chat.ts";
import { serverTimestamp } from 'firebase/firestore';

interface ViewProfileProps {
    onBackClick: () => void;
    userData: User;
    loggedUserData?: User;
    onBlockChange: () => void;
}

export const addMatch = async (likerId: string, likedId: string) => {
    const matchesRef = collection(db, 'matches');
    const matchId = likerId < likedId ? `${likerId}_${likedId}` : `${likedId}_${likerId}`;
    await setDoc(doc(matchesRef, matchId), {
        user1_id: likerId < likedId ? likerId : likedId,
        user2_id: likerId > likedId ? likerId : likedId,
        timestamp: serverTimestamp()
    });

    console.log('Match created:', matchId);
};

const ViewProfile: React.FC<ViewProfileProps> = (
    { onBackClick, userData, onBlockChange }
) => {
    const [expanded, setExpanded] = useState(true)
    const [isBlocked, setIsBlocked] = useState(false)
    const [isBlockLoading, setIsBlockLoading] = useState(false)
    const [currentImage, setCurrentImage] = useState(0)
    const moreDetailsContainer = useRef(null)
    const likeControls = useAnimationControls()
    const navigate = useNavigate();
    const { user, auth } = useAuthStore()
    const { userLikes } = useSyncUserLikes(user!.uid!)
    const { selectedProfile } = useDashboardStore()
    const { setChatId } = useChatIdStore()
    const [openModal, setOpenModal] = useState(false);

    const goToNextPost = () => {
        if (currentImage < userData.photos!.length - 1) {
            setCurrentImage(value => value + 1)
        }
    }
    const goToPreviousPost = () => {
        if (currentImage > 0) {
            setCurrentImage(value => value - 1)
        }
    }

    const { fetchMatches } = useMatchStore()

    const addLike = async () => {
        // const db = getFirestore();
        try {
            const likesRef = collection(db, 'likes');
            const likeId = `${user?.uid}_${userData.uid}`;

            await setDoc(doc(db, "likes", likeId), {
                uid: likeId,
                liker_id: user?.uid,
                liked_id: userData.uid,
                timestamp: serverTimestamp()
            }).then(async () => {
                {/* @ts-expect-error quick-fix */}
                const q = query(likesRef, where('liker_id', '==', userData.uid), where('liked_id', '==', user.uid));
                const mutualLikeSnapshot = await getDocs(q);

                if (!mutualLikeSnapshot.empty) {
                    // Mutual like detected, create a match
                    await addMatch(user?.uid as string, userData?.uid as string);
                    toast.success(`You're Matched With ${userData.first_name}`);
                    fetchMatches(user?.uid as string);
                }
            }).catch(err => console.error("An error occured while updating likes: ", err));
            toast.success(`Your Like has been sent to ${userData.first_name}`);

        } catch (err) {
            console.error("Error adding like:", err);
            toast.error("Something went wrong, couldn't send the like");
        }
    };

    const triggerHeartAnimation = async () => {
        await likeControls.start({
            scale: [1, 16, 32], // Scale up, then slightly shrink for a bounce effect
            opacity: [1, 1, 0],   // Stay visible at first, then fade out
            // y: [0, -50, -80],     // Move the heart upwards
            transition: {
                duration: 0.4,      // Overall duration of the animation
                ease: "easeOut",    // Easing for smooth animation
            },
        });

        onBackClick()
        await addLike()
    };

    // Function to check if a block relationship exists
    const checkIfBlocked = async (blockerId?: string | null, blockedId?: string | null): Promise<boolean> => {
        if (!blockerId || !blockedId) return Promise.resolve(false);

        const userRef = doc(db, "users", blockerId);

        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return data?.blockedIds?.includes(blockedId) || false;
            }
            return false;
        } catch (error) {
            console.error("Error checking blocked status:", error);
            return false;
        }
    };

    useEffect(() => {
        if (user?.uid && userData?.uid) {
            setIsBlockLoading(true)
            hasUserBeenLiked()
            checkIfBlocked(user.uid, userData.uid).then((blockedStatus) => {
                setIsBlocked(blockedStatus);
                setIsBlockLoading(false);
            });
        }
    }, [user?.uid, userData?.uid]);

    const blockUser = async (isBlocked: boolean, onBlockChange: () => void) => {
        setIsBlockLoading(true);
        if (!user || !userData)
            return (
                <div>
                    No User Data
                </div>);

        try {
            const userRef = doc(db, "users", user?.uid as string);

            if (isBlocked) {
                await updateDoc(userRef, {
                    blockedIds: arrayRemove(userData.uid)
                });
            } else {
                await updateDoc(userRef, {
                    blockedIds: arrayUnion(userData.uid)
                });
            }

            setIsBlockLoading(false);
            toast.success(`${userData.first_name} has been ${isBlocked ? "unblocked" : "blocked"} successfully.`);
            setIsBlocked(!isBlocked);
            onBackClick()
            fetchMatches(user?.uid as string)
            onBlockChange()
        } catch (error) {
            console.error("Error blocking/unblocking user:", error);
            toast.error("Could not block/unblock the user. Please try again.");
            setIsBlockLoading(false)
        }
    };

    if (!userData) {
        console.error("userData is missing in ViewProfile component");
        toast("Unable to fetch user data")

        onBackClick()
        return;
    }

    const hasUserBeenLiked = () => {
        return Boolean(userLikes.filter(like => (like.liked_id === selectedProfile)).length)
    }

    const fetchUserChats = async (id: string) => {
        const chatDocRef = doc(db, "chats", id);
        const chatDocSnap = await getDoc(chatDocRef);
        return chatDocSnap.exists() ? chatDocSnap.data() as Chat : null;
    };

    return (
        <>
            <ReportModal userData={userData} show={openModal} onCloseModal={() => setOpenModal(false)} />
            <DashboardPageContainer className="preview-profile preview-profile--view-profile">
                <div className="preview-profile__action-buttons">
                    {!hasUserBeenLiked() &&
                        <div className="preview-profile__action-button">
                            <motion.img animate={likeControls} onClick={triggerHeartAnimation}
                                src="/assets/icons/heart.svg" />
                        </div>
                    }
                    {hasUserBeenLiked() && <div className="preview-profile__action-button liked">
                        <motion.img src="/assets/icons/white-heart.png" />
                    </div>
                    }
                    {<div className="preview-profile__action-button"
                          onClick={async () => {
                              toast.loading("Loading chat..")
                              const chatId = [auth?.uid, userData.uid].sort().join('_');
                              setChatId(chatId)
                              await createOrFetchChat(auth?.uid as string, userData?.uid as string, setChatId).then(
                                  async () => {
                                      const chat = await fetchUserChats(chatId) as Chat;
                                      if (chatId != "nil" || !chat || !chat.participants || chat.participants.length < 2) {
                                          const bothPremiumUsers = userData.is_premium && user?.is_premium
                                          navigate(`/dashboard/chat?recipient-user-id=${userData.uid}`, {
                                              state: {
                                                  chatId,
                                                  recipientUser: userData,
                                                  chatUnlocked: bothPremiumUsers ? true : chat.is_unlocked ? chat.is_unlocked : false
                                              },
                                          });
                                          setChatId(chatId)
                                      }
                                  }
                              )
                          }}>
                        <img src="/assets/icons/message-heart.svg" alt={``} />
                    </div>}
                </div>
                <div className="preview-profile__parent-container">
                    <motion.div
                        initial={{ padding: 0, height: '46rem' }}
                        className="preview-profile__profile-container">
                        <div className="preview-profile__action-buttons">
                            {!hasUserBeenLiked() &&
                                <div className="preview-profile__action-button">
                                    <motion.img animate={likeControls} onClick={triggerHeartAnimation}
                                                src="/assets/icons/heart.svg" />
                                </div>
                            }
                            {hasUserBeenLiked() && <div className="preview-profile__action-button liked">
                                <motion.img src="/assets/icons/white-heart.png" />
                            </div>}
                            {<div className="preview-profile__action-button"
                                  onClick={async () => {
                                      toast.loading("Loading chat..")
                                      const chatId = [auth?.uid, userData.uid].sort().join('_');
                                      setChatId(chatId)
                                      await createOrFetchChat(auth?.uid as string, userData?.uid as string, setChatId).then(
                                          async () => {
                                              const chat = await fetchUserChats(chatId) as Chat;
                                              if (chatId != "nil" || !chat || !chat.participants || chat.participants.length < 2) {
                                                  const bothPremiumUsers = userData.is_premium && user?.is_premium
                                                  navigate(`/dashboard/chat?recipient-user-id=${userData.uid}`, {
                                                      state: {
                                                          chatId,
                                                          recipientUser: userData,
                                                          chatUnlocked: bothPremiumUsers ? true : chat.is_unlocked ? chat.is_unlocked : false
                                                      },
                                                  });
                                                  setChatId(chatId)
                                              }
                                          }
                                      )
                                  }}>
                                <img src="/assets/icons/message-heart.svg" alt={``} />
                            </div>}
                        </div>
                        <div className="preview-profile__fake-next-card"></div>
                        <div className="preview-profile__fake-next-card"></div>
                        <div className="preview-profile__navigation-buttons">
                            <button onClick={onBackClick} className="preview-profile__navigation-button">
                                <div className="preview-profile__navigation-button-icon-container">
                                    <img src="/assets/icons/arrow-left-white.svg" alt={``} />
                                </div>
                                <span className="preview-profile__navigation-button-text text-white">Back</span>
                            </button>
                        </div>
                        <motion.div initial={{ borderRadius: 0, height: '46rem' }} className="preview-profile__card">
                            <figure
                                className="preview-profile__image-bg-container">
                                {userData?.photos?.map((src, index) =>
                                (
                                    <motion.img key={index} initial={{ opacity: currentImage == index ? 1 : 0 }}
                                        animate={{ opacity: currentImage == index ? 1 : 0 }}
                                        className="preview-profile__profile-image" src={src} />
                                )
                                )}
                            </figure>
                            {userData?.photos?.length !== 0 && <div className="preview-profile__overlay">
                                <div onClick={goToPreviousPost}
                                    className={`previous-button ${currentImage > 0 && 'clickable'}`}>
                                    <button>
                                        <img src="/assets/icons/arrow-right.svg" alt={``} />
                                    </button>
                                </div>
                                <div onClick={goToNextPost}
                                    className={`next-button ${currentImage < (userData?.photos?.length as number - 1) && 'clickable'}`}>
                                    <button>
                                        <img src="/assets/icons/arrow-right.svg" />
                                    </button>
                                </div>
                            </div>}
                            <div className="preview-profile__profile-details">
                                <div className="status-row">
                                    {userData?.user_settings?.online_status ?
                                        (userData.status?.online ? (
                                            <div className="active-badge">{'Online'}</div>
                                        ) : (
                                            <div className="non-active-badge">{'Offline'}</div>
                                        )) : null
                                    }
                                    {userData.location && user?.location &&
                                        <p className="location">~ {userData.distance}</p>}
                                </div>
                                <motion.div initial={{ marginBottom: '2.8rem' }} className="name-row">
                                    <div className="left">
                                        <p className="details">{userData.first_name}, <span className="age">{(new Date()).getFullYear() - getYearFromFirebaseDate(userData.date_of_birth)}</span></p>
                                        {userData.is_approved && <img src="/assets/icons/verified.svg" />}
                                    </div>
                                    {/* <AnimatePresence>
                                {expanded && <motion.img exit={{ opacity: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="contract-icon" onClick={() => {
                                        (profileContainer.current as unknown as { scrollTop: number })!.scrollTop = 0
                                        setExpanded(!expanded)
                                    }} src="/assets/icons/down.svg" />}
                            </AnimatePresence> */}
                                </motion.div>
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 0, opacity: 0 }}
                                    ref={moreDetailsContainer} className="more-details">
                                    {/* {userPrefencesData?.bio && <p className="bio">
                                {userPrefencesData.bio.slice(0, 200)}...
                            </p>} */}
                                    <p className="bio">{userData.bio}</p>
                                    <div className="interests-row">
                                        <img src="/assets/icons/interests.svg" />
                                        <div className="interests">
                                            <div className="interests">
                                                <div className="interest">Travelling</div>
                                                <div className="interest">Travelling</div>
                                                <div className="interest">Travelling</div>
                                                <div className="interest">Travelling</div>
                                                <div className="interest">Travelling</div>
                                                <div className="interest">Travelling</div>
                                                {userData?.interests?.map((interest: string, index: number) => (
                                                    <div key={index} className="interest">{interest}</div>))}
                                                {/* <div className="interest">Travelling</div> */}
                                            </div>
                                        </div>
                                        <img onClick={() => {
                                            setExpanded(!expanded)
                                        }} className="expand-profile" src="/assets/icons/down.svg" alt={``} />
                                    </div>
                                </motion.div>
                                <div className="preview-profile__image-counter-container">
                                    {userData.photos?.length !== 1 && <>
                                        {userData?.photos?.map((_image, index) => (
                                            <div key={index} onClick={() => {
                                                setCurrentImage(index);
                                            }} className={`preview-profile__image-counter ${index == currentImage && "preview-profile__image-counter--active"}`}></div>
                                        ))}
                                    </>}
                                </div>
                            </div>
                        </motion.div>
                        <div className="preview-profile__more-details">
                            {userData.preference !== null &&
                                <div className="content-item">
                                    <div className="content-item__title">
                                        <img src="/assets/icons/relationship-preference.svg" />
                                        Relationship preference
                                    </div>
                                    <div className="content-item__value">
                                        {<img src={relationship_preferences[userData.preference!].image} alt={``} />}
                                        {preference[userData.preference!]}
                                    </div>
                                </div>
                            }
                            {userData?.bio && <div className="content-item">
                                <div className="content-item__title">
                                    <img src="/assets/icons/relationship-preference.svg" />
                                    Bio
                                </div>
                                <div className="content-item__value">
                                    {userData.bio}
                                </div>
                            </div>}
                            {userData.interests && userData.interests.length > 0 && <div className="content-item">
                                <div className="content-item__title">
                                    <img src="/assets/icons/interests-black.svg" />
                                    Interests
                                </div>
                                <div className="content-item__multi-options-container">
                                    {userData?.interests.map((interest: string, index: number) => (
                                        <div key={index} className="content-item__multi-options-container__item">{interest}
                                            {user?.interests?.includes(interest) &&
                                                <img src="/assets/icons/golden-star-in-circle.svg" alt={``} />}
                                        </div>
                                    ))}
                                </div>
                            </div>}
                            <div className="content-item">
                                <div className="content-item__title">
                                    <img src="/assets/icons/about.svg" alt={``} />
                                    About
                                </div>
                                <div className="content-item__info">
                                    <p className="content-item__info__title">Stays in</p>
                                    <p className="content-item__info__text">{userData.state &&
                                        <span>{userData.state},</span>} {userData.country_of_origin}</p>
                                </div>
                                <div className="content-item__info">
                                    <p className="content-item__info__title">Gender</p>
                                    <p className="content-item__info__text">{userData.gender}</p>
                                </div>
                                {![null, undefined].includes(userData.education as unknown as any) && <div className="content-item__info">
                                    <p className="content-item__info__title">Education</p>
                                    {/* @ts-expect-error quick-fix */}
                                    <p className="content-item__info__text">{education[userData.education]}</p>
                                </div>}
                                {![null, undefined].includes(userData.religion as unknown as any) && <div className="content-item__info">
                                    <p className="content-item__info__title">Religion</p>
                                    {/* @ts-expect-error quick-fix */}
                                    <p className="content-item__info__text">{religion[userData.religion]}</p>
                                </div>}
                            </div>
                            {([userData.family_goal, userData.weight, userData.height].some(item => item !== null && item !== undefined)) &&
                                <div className="content-item">
                                    <div className="content-item__title">
                                        <img src="/assets/icons/need-to-know.svg" alt={``} />
                                        Need To Know
                                    </div>
                                    {(userData.family_goal || userData.family_goal! >= 0) &&
                                        <div className="content-item__info">
                                            <p className="content-item__info__title">Future family goals</p>
                                            <p className="content-item__info__text">{family_goal[userData.family_goal!]}</p>
                                        </div>}
                                    {userData.weight && <div className="content-item__info">
                                        <p className="content-item__info__title">Weight</p>
                                        <p className="content-item__info__text">{userData.weight ? `${Math.round(userData.weight)}kg` : null}</p>
                                    </div>}
                                    {userData.height && <div className="content-item__info">
                                        <p className="content-item__info__title">Height</p>
                                        <p className="content-item__info__text">{userData.height ? `${Math.round(userData.height)}cm` : null}</p>
                                    </div>}
                                </div>}
                            {([userData.smoke, userData.drink, userData.workout].some(item => item !== null && item !== undefined)) &&
                                <div className="content-item">
                                    <div className="content-item__title">
                                        <img src="/assets/icons/personal-habits.svg" alt={``} />
                                        Personal habits
                                    </div>
                                    {(userData.smoke || userData.smoke == 0) && <div className="content-item__info">
                                        <p className="content-item__info__title">Smoker?</p>
                                        <p className="content-item__info__text">{smoking[userData.smoke]}</p>
                                    </div>}
                                    {(userData.drink || userData.drink == 0) && <div className="content-item__info">
                                        <p className="content-item__info__title">Drinker?</p>
                                        {<p className="content-item__info__text">{drinking[userData.drink]}</p>}
                                    </div>}
                                    {(userData.workout || userData.workout == 0) && <div className="content-item__info">
                                        <p className="content-item__info__title">Works Out?</p>
                                        <p className="content-item__info__text">{workout[userData.workout]}</p>
                                    </div>}
                                </div>}

                            {isBlockLoading ?
                                <div className={`action-button`}>
                                    <motion.img key="loading-image" className='button__loader'
                                        src='/assets/icons/loader-black.gif' />
                                </div> :

                                <div className="action-button" onClick={() => blockUser(isBlocked, onBlockChange)}>
                                    <img src="/assets/icons/block.svg" alt={``} />
                                    {isBlocked ? "Unblock" : "Block"} {userData.first_name}
                                </div>
                            }

                            <button className="action-button action-button--danger" onClick={() => setOpenModal(true)}>
                                <img src="/assets/icons/report.svg" alt={``} />
                                Report {userData.first_name}
                            </button>
                        </div>
                    </motion.div>

                </div>
            </DashboardPageContainer>
        </>
    )
}
export default ViewProfile;