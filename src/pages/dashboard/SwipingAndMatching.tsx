import {family_goal, preference} from "@/constants";
import {db} from "@/firebase";
import {useAuthStore} from "@/store/UserId";
import {
    arrayRemove, arrayUnion,
    collection,
    doc,
    GeoPoint,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    QueryDocumentSnapshot,
    setDoc,
    startAfter, updateDoc, deleteDoc,
    where
} from "firebase/firestore";
import {
    AnimatePresence,
    AnimationControls,
    motion,
    MotionValue,
    useAnimationControls,
    useMotionValue,
    useTransform
} from 'framer-motion';
import {geohashForLocation} from 'geofire-common';
import Lottie from "lottie-react";
import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {uid} from 'react-uid';
import Cat from "../../Cat.json";
import {User} from "@/types/user";
import {calculateAge} from "@/utils/age";
import {distanceInMiles} from "@/utils/distance";
import {isRecentlyOnline} from "@/utils/presence";
import DiscoveryStateMessage from "@/components/dashboard/DiscoveryStateMessage";
import useSyncUserLikes from "@/hooks/useSyncUserLikes";
import useSyncUserDislikes from "@/hooks/useSyncUserDislikees";
import {addMatch} from "@/components/dashboard/ViewProfile.tsx";
import useDashboardStore from "@/store/useDashboardStore.tsx";
import toast from "react-hot-toast";
import {useMatchStore} from "@/store/Matches.tsx";
import { getUserProfile } from "@/hooks/useUser";
import {useNavigationStore} from "@/store/NavigationStore.tsx";
import ReportModal from "@/components/dashboard/ReportModal.tsx";
import {useVerificationGate} from "@/hooks/useVerificationGate.tsx";

interface ProfileCardProps {
    profiles: User[],
    setProfiles: Dispatch<SetStateAction<User[]>>,
    item: User,
    setActionButtonsOpacity: Dispatch<SetStateAction<MotionValue<number>>>
    setChosenActionButtonOpacity: Dispatch<SetStateAction<MotionValue<number>>>
    setChosenActionScale: Dispatch<SetStateAction<MotionValue<number>>>;
    setActiveAction: Dispatch<SetStateAction<'like' | 'cancel'>>;
    controls: AnimationControls;
    // Guards the like action behind face verification; returns false (and shows
    // the gate modal) when the current user isn't approved yet. Owned by the
    // parent so a single modal instance is shared across all cards.
    requireVerification: () => boolean;
    index: number, nextCardOpacity: number, setNextCardOpacity: Dispatch<SetStateAction<MotionValue<number>>>
}

const ProfileCard: React.FC<ProfileCardProps> = ({
    profiles, setProfiles, item, setActiveAction, setActionButtonsOpacity, setChosenActionButtonOpacity, setChosenActionScale, controls, requireVerification, index, nextCardOpacity, setNextCardOpacity
}) => {
    const x = useMotionValue(0)
    const activeCardOpacity = useTransform(x, [-160, -30, 0, 30, 160], [0, 1, 1, 1, 0])
    const activeCardRotation = useTransform(x, [-200, 200], [18, -18])
    const actionButtonsOpacity = useTransform(x, [-160, -150, -20, -5, 0, 5, 20, 150, 160], [1, 0, 0, 1, 1, 1, 0, 0, 1])
    const chosenActionButtonOpacity = useTransform(x, [-160, -140, -20, -10, 0, 10, 20, 140, 160], [0, 1, 1, 0, 0, 0, 1, 1, 0])
    const chosenActionScale = useTransform(x, [-160, -100, -10, 0, 10, 100, 160], [1.6, 1, 1, 1, 1, 1, 1.6])
    const nextCardOpacityValue = useTransform(x, [-160, 0, 160], [1, 0, 1])
    const { user, auth } = useAuthStore()
    const profileContainer = useRef(null);
    const moreDetailsContainer = useRef(null)
    const [currentImage, setCurrentImage] = useState(0)
    const [expanded, setExpanded] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [isBlockLoading, setIsBlockLoading] = useState(false)
    const [openModal, setOpenModal] = useState(false);
    const  {fetchMatches} = useMatchStore()
    const [loggedUserData, setLoggedUserData] = useState<User | null>(null);
    const { setActivePage: setPage } = useNavigationStore()

    useEffect(() => {
        setPage('user-profile')
    }, []);

    const fetchLoggedUserData = async () => {
        const data = await getUserProfile("users", auth?.uid as string) as User;
        setLoggedUserData(data);
    }

    useEffect(() => {
        fetchLoggedUserData().catch(err => console.error(err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const goToNextPost = () => {
        if (currentImage < (item.photos?.length as number) - 1) {
            setCurrentImage(value => value + 1)
        }
    }
    const goToPreviousPost = () => {
        if (currentImage > 0) {
            setCurrentImage(value => value - 1)
        }
    }

    const handleDragEnd = () => {
        if (Math.abs(x.get()) > 160) {
            const isLike = x.get() > 160;
            // Unverified users can pass on profiles but not like them. Bail out
            // before removing the card so the drag constraints snap it back.
            if (isLike && !requireVerification()) return;
            setProfiles(profiles.filter((profileItem) => item !== profileItem))
            controls.start((item) => {
                return (item == profiles[profiles.length - 2] ? {
                    y: 0,
                    width: '100%'
                } : (item == profiles[profiles.length - 3] ? {
                    y: 12,
                    width: 'calc(100% - 48px)'
                } : { y: 24, width: 'calc(100% - 96px)' }))
            })
            nextCardOpacityValue.set(0)
            setNextCardOpacity(nextCardOpacityValue)
            if (isLike) {
                addLike().catch(e => console.error(e))
            }
            else {
                addDislike().catch(e => console.error(e))
            }
        }
    }

    // C3: this used to compute real kilometres (haversineDistance) but label
    // them "miles" — distanceInMiles is the actual unit shown everywhere else.
    const distanceAwayInMiles: number | null =
        typeof loggedUserData?.latitude === 'number' && typeof loggedUserData?.longitude === 'number' &&
        typeof item.latitude === 'number' && typeof item.longitude === 'number'
            ? distanceInMiles([loggedUserData.latitude, loggedUserData.longitude], [item.latitude, item.longitude])
            : null;


    x.on("change", latest => {
        setActionButtonsOpacity(actionButtonsOpacity)
        setChosenActionButtonOpacity(chosenActionButtonOpacity)
        setChosenActionScale(chosenActionScale)
        setNextCardOpacity(nextCardOpacityValue)
        if (latest < 0) setActiveAction('cancel')
        else setActiveAction('like')
    })

    useEffect(() => {
        nextCardOpacityValue.set(0)
        setNextCardOpacity(nextCardOpacityValue)
    }, [profiles.length])

    const addLike = async () => {
        // const db = getFirestore();
        try {
            const likesRef = collection(db, 'likes');
            const likeId = `${user?.uid}_${item.uid}`;

            await setDoc(doc(db, "likes", likeId), {
                uid: likeId,
                liker_id: user?.uid,
                liked_id: item.uid,
                timestamp: new Date().toISOString()
            }).then(async () => {
                {/* @ts-expect-error quick-fix */}
                const q = query(likesRef, where('liker_id', '==', item.uid), where('liked_id', '==', user.uid));
                const mutualLikeSnapshot = await getDocs(q);

                if (!mutualLikeSnapshot.empty) {
                    // Mutual like detected, create a match
                    await addMatch(user?.uid as string, item?.uid as string);
                    toast.success(`You're Matched With ${item.first_name}`);
                    fetchMatches(user?.uid as string);
                }
            }).catch(err => console.error("An error occurred while updating likes: ", err));
            toast.success(`Your Like has been sent to ${item.first_name}`);

        } catch (err) {
            console.error("Error adding like:", err);
            toast.error("Something went wrong, couldn't send the like");
        }
    };


    const addDislike = async () => {
        try {
            const dislikeId = `${user?.uid}_${item.uid}`;  // Unique ID for the dislike document

            await setDoc(doc(db, "dislikes", dislikeId), {
                uid: dislikeId,
                disliker_id: user?.uid,
                disliked_id: item.uid,
                timestamp: new Date().toISOString()
            });

            console.log('User added to the dislike list');
        } catch (err) {
            console.log('Something went wrong, unable to add to dislike list.', err);
        }
    };

    const cancelProfile = async (item: User) => {
        await controls.start((item) => ({
            x: item == profiles[profiles.length - 1] ? -180 : 0,
            transition: { duration: 0.5 }
        }))

        const dislikeId = `${user?.uid}_${item.uid}`;  // Unique ID for the dislike document
        await setDoc(doc(db, "dislikes", dislikeId), {
            uid: dislikeId,
            disliker_id: user?.uid,
            disliked_id: item.uid,
            timestamp: new Date().toISOString()
        });

        console.log('User added to the dislike list');

        setProfiles(profiles.filter((_profileItem, index) => index !== profiles.length - 1))
        await controls.start((item) => {
            return (item == profiles[profiles.length - 2] ? {
                y: 0,
                width: '100%'
            } : (item == profiles[profiles.length - 3] ? {
                y: 12,
                width: 'calc(100% - 48px)'
            } : {y: 24, width: 'calc(100% - 96px)'}))
        })
    }

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
        if (user?.uid && item?.uid) {
            setIsBlockLoading(true)
            checkIfBlocked(user.uid, item.uid).then((blockedStatus) => {
                setIsBlocked(blockedStatus);
                setIsBlockLoading(false);
            });
        }
    }, [user?.uid, item?.uid]);

    const removeDislike = async (swipedUserId: string) => {
        try {
            const dislikeId = `${user?.uid}_${swipedUserId}`;
            const dislikeDocRef = doc(db, "dislikes", dislikeId);
            await deleteDoc(dislikeDocRef);
            console.log("Dislike removed successfully");
        } catch (error) {
            console.error("Error removing dislike:", error);
        }
    };


    const blockUser = async (isBlocked: boolean) => {
        setIsBlockLoading(true);
        if (!user || !item)
            return (
                <div>
                    No User Data
                </div>);

        try {
            const userRef = doc(db, "users", user?.uid as string);

            if (isBlocked) {
                await updateDoc(userRef, {
                    blockedIds: arrayRemove(item.uid)
                }).then(async () => {
                    await removeDislike(item.uid as string);
                }).catch(e => console.error(e));

            } else {
                await updateDoc(userRef, {
                    blockedIds: arrayUnion(item.uid)
                }).then(async () => {
                    await cancelProfile(item)
                }).catch(e => console.error(e));
            }

            setIsBlockLoading(false);
            toast.success(`${item.first_name} has been ${isBlocked ? "unblocked" : "blocked"} successfully.`);
            setIsBlocked(!isBlocked);


        } catch (error) {
            console.error("Error blocking/unblocking user:", error);
            toast.error("Could not block/unblock the user. Please try again.");
            setIsBlockLoading(false)
        }
    };

    const handleShortcuts = useCallback(
        (e: { keyCode: number}) => {
            if (e.keyCode == 32) {
                if (currentImage < (item.photos?.length as number) - 1) {
                    setCurrentImage(currentImage + 1)
                } else {
                    setCurrentImage(0)
                }
            }else if (e.keyCode == 38){
                setExpanded(true)
            } else if (e.keyCode == 40){
                setExpanded(false)
            }

        }, [currentImage])

    useEffect(() => {
        window.addEventListener('keydown', handleShortcuts)
        return () => {
            window.removeEventListener('keydown', handleShortcuts)
        }
    }, [handleShortcuts])

    useEffect(() => {
        setCurrentImage(0)
    }, [profiles.length])

    return (
        <>
            <ReportModal userData={item} show={openModal} onCloseModal={() => setOpenModal(false)} />
            {<motion.div onDragEnd={handleDragEnd} style={{ x, opacity: activeCardOpacity, rotate: activeCardRotation, overflowY: expanded ? 'scroll' : 'hidden' }} ref={profileContainer} custom={item} initial={{ y: item == profiles[profiles.length - 1] ? 0 : (item == profiles[profiles.length - 2] ? 12 : 24), width: item == profiles[profiles.length - 1] ? '100%' : (profiles[profiles.length - 2] == item ? 'calc(100% - 48px)' : 'calc(100% - 96px)') }} animate={controls} drag={index == profiles.length - 1 ? "x" : undefined} dragConstraints={{ left: 0, right: 0 }} className="profile-card preview-profile">
                <motion.div initial={{ opacity: item == profiles[profiles.length - 1] ? 1 : 0 }}
                    style={index == profiles.length - 2 ? { opacity: nextCardOpacity } : {}}
                    // animate={{ opacity: item == profiles[profiles.length - 1] ? 1 : 0 }}
                    animate={expanded ? { padding: 0, height: '46rem' } : {}}
                    className="preview-profile__profile-container">
                    <motion.div initial={{ borderTopRightRadius: '1.42rem', borderTopLeftRadius: '1.42rem', borderBottomRightRadius: '2.84rem', borderBottomLeftRadius: '2.84rem' }} animate={expanded ? {
                        // borderRadius: 0,
                        borderBottomRightRadius: 0, borderBottomLeftRadius: 0,
                    } : {
                        borderTopRightRadius: '1.42rem', borderTopLeftRadius: '1.42rem', borderBottomRightRadius: '2.84rem', borderBottomLeftRadius: '2.84rem'
                    }} className={`preview-profile__card ${index == profiles.length - 1 ? 'hover:cursor-grab active:cursor-grabbing' : ''}`}>
                        <figure className="preview-profile__image-bg-container">
                            {item?.photos?.map((src, index) =>
                            (
                                <motion.img key={index} animate={{ opacity: currentImage == index ? 1 : 0 }} className="preview-profile__profile-image" src={src} />
                            )
                            )}
                        </figure>
                        <div className="preview-profile__overlay">
                            <div onClick={goToPreviousPost} className={`previous-button ${currentImage > 0 && 'clickable'}`}>
                                <button>
                                    <img src="/assets/icons/arrow-right.svg" alt={``}/>
                                </button>
                            </div>
                            <div onClick={goToNextPost} className={`next-button ${currentImage < (item?.photos?.length as number) - 1 && 'clickable'}`}>
                                <button>
                                    <img src="/assets/icons/arrow-right.svg" alt={``}/>
                                </button>
                            </div>
                        </div>
                        <div className="preview-profile__profile-details">
                            <div className="status-row">
                                {isRecentlyOnline(item.status) && <div className="active-badge">Online</div>}
                                <p className="location">{distanceAwayInMiles != null ? `~ ${distanceAwayInMiles.toFixed(1)} miles away` : `loading...`}</p>
                            </div>
                            <motion.div animate={expanded ? { marginBottom: '2.8rem' } : { marginBottom: '1.2rem' }} className="name-row">
                                <div className="left">
                                    <p className="details">{item?.first_name}, <span className="age">{calculateAge(item?.date_of_birth) ?? ''}</span></p>
                                    <img src="/assets/icons/verified.svg" alt={``}/>
                                </div>
                                <AnimatePresence>
                                    {expanded && <motion.img exit={{ opacity: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="contract-icon" onClick={() => {
                                            (profileContainer.current as unknown as { scrollTop: number }).scrollTop = 0
                                            setExpanded(!expanded)
                                        }} src="/assets/icons/down.svg" />}
                                </AnimatePresence>
                            </motion.div>
                            <motion.div initial={{ height: 'auto' }} animate={expanded ? { height: 0, opacity: 0 } : { height: 'auto' }} ref={moreDetailsContainer} className="more-details">
                                {item?.bio && <p className="bio">
                                    {item.bio.slice(0, 200)}...
                                </p>}
                                <div className="interests-row">
                                    <img src="/assets/icons/interests.svg" alt={``} />
                                    <div className="interests">
                                        {item?.interests?.slice(0, 4)?.map((item, i) =>
                                            <div key={i} className="interest">{item}</div>)}
                                        {/* <div className="interest">Travelling</div> */}
                                    </div>
                                    <img onClick={() => {
                                        setExpanded(!expanded)
                                    }} data-cy="expand-profile-card" className="expand-profile" src="/assets/icons/down.svg" alt={``} />
                                </div>
                            </motion.div>
                            <div className="preview-profile__image-counter-container">
                                {item.photos?.map((_image, index) => (
                                    <div key={index} onClick={() => { setCurrentImage(index) }} className={`preview-profile__image-counter ${index == currentImage && "preview-profile__image-counter--active"}`}></div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
                <div className="preview-profile__more-details">
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/relationship-preference.svg" alt={``} />
                            Relationship preference
                        </div>
                        <div className="content-item__value">
                            {preference[item?.preference as number]}
                        </div>
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/relationship-preference.svg" alt={``} />
                            Bio
                        </div>
                        {item?.bio && <div className="content-item__value">
                            {item.bio}
                        </div>}
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/interests-black.svg" />
                            Interests
                        </div>
                        <div className="content-item__multi-options-container">
                            {item?.interests?.map((item, i) => <div key={i} className="content-item__multi-options-container__item">
                                {item}
                            </div>)}
                        </div>
                    </div>
                    <div className="content-item">
                        <div className="content-item__title">
                            <img src="/assets/icons/need-to-know.svg" />
                            Personal habits
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Future family goals</p>
                            {item?.family_goal && <p className="content-item__info__text">{family_goal[item?.family_goal as number]}</p>}
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Weight</p>
                            {item?.weight ? <p className="content-item__info__text">{item.weight}kg</p> : <p className="content-item__info__text">Not specified</p>}
                        </div>
                        <div className="content-item__info">
                            <p className="content-item__info__title">Height</p>
                            {item?.height ? <p className="content-item__info__text">{item.height}cm</p> : <p className="content-item__info__text">Not specified</p>}
                        </div>
                    </div>
                    {isBlockLoading ?
                        <div className={`action-button`}>
                            <motion.img key="loading-image" className='button__loader'
                                        src='/assets/icons/loader-black.gif' />
                        </div> :

                        <div className="action-button" onClick={() => blockUser(isBlocked)}>
                            <img src="/assets/icons/block.svg" alt={``} />
                            {isBlocked ? "Unblock" : "Block"} {item.first_name}
                        </div>
                    }
                    <div className="action-button action-button--danger" onClick={() => setOpenModal(true)}>
                        <img src="/assets/icons/report.svg" alt={``}/>
                        Report {item.first_name}
                    </div>
                </div>
            </motion.div>}
        </>
    )
}
const SwipingAndMatching = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<User[]>([])
    const x = useMotionValue(0)
    const controls = useAnimationControls()
    const { user, auth } = useAuthStore()

    const [loggedUserData, setLoggedUserData] = useState<User | null>(null);
    const { setActivePage: setPage } = useNavigationStore()

    useEffect(() => {
        setPage('user-profile')
    }, []);

    const fetchLoggedUserData = async () => {
        const data = await getUserProfile("users", auth?.uid as string) as User;
        setLoggedUserData(data);
    }

    useEffect(() => {
        fetchLoggedUserData().catch(err => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Blocks liking/messaging until the user's selfie is approved, and routes
    // them into the capture flow when they still need to submit one.
    const { requireVerification, modals: verificationModals } = useVerificationGate(loggedUserData, fetchLoggedUserData);

    const { fetchMatches } = useMatchStore()
    const { updateUser } = useAuthStore()
    const { userLikes, loading: likesLoading } = useSyncUserLikes(user!.uid!)
    const { userDislikes, loading: dislikesLoading } = useSyncUserDislikes(user!.uid!)

    const [swipedUser, setSwipedUser] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'like' | 'cancel' | null>(null);

    useEffect(() => {
        if (swipedUser && actionType) {
            if (actionType === 'like') {
                likeProfile().catch((err) => console.log(err));
            } else if (actionType === 'cancel') {
                cancelProfile().catch((err) => console.log(err));
            }
            setActionType(null);
        }
    }, [swipedUser, actionType]);


    const cancelProfile = async () => {
        await controls.start((item) => ({
            x: item == profiles[profiles.length - 1] ? -180 : 0,
            transition: { duration: 0.5 }
        }))

        const dislikeId = `${user?.uid}_${swipedUser}`;  // Unique ID for the dislike document
        await setDoc(doc(db, "dislikes", dislikeId), {
            uid: dislikeId,
            disliker_id: user?.uid,
            disliked_id: swipedUser,
            timestamp: new Date().toISOString()
        });

        console.log('User added to the dislike list');

        setProfiles(profiles.filter((_profileItem, index) => index !== profiles.length - 1))
        await controls.start((item) => {
            return (item == profiles[profiles.length - 2] ? {
                y: 0,
                width: '100%'
            } : (item == profiles[profiles.length - 3] ? {
                y: 12,
                width: 'calc(100% - 48px)'
            } : {y: 24, width: 'calc(100% - 96px)'}))
        })
    }

    const likeProfile = async () => {
        await controls.start((item) => ({
            x: item == profiles[profiles.length - 1] ? 180 : 0,
            transition: { duration: 0.5 }
        }))

        const likesRef = collection(db, 'likes');
        const likeId = `${user?.uid}_${swipedUser}`;

        await setDoc(doc(db, "likes", likeId), {
            uid: likeId,
            liker_id: user?.uid,
            liked_id: swipedUser,
            timestamp: new Date().toISOString()
        }).then(async () => {
            {/* @ts-expect-error quick-fix */}
            const q = query(likesRef, where('liker_id', '==', swipedUser), where('liked_id', '==', user.uid));
            const mutualLikeSnapshot = await getDocs(q);

            if (!mutualLikeSnapshot.empty) {
                // Mutual like detected, create a match
                await addMatch(user?.uid as string, swipedUser as string);
                fetchMatches(user?.uid as string);
            }
        }).catch(err => console.error("An error occured while updating likes: ", err));

        // @ts-expect-error legacy type mismatch unused vars
        setProfiles(profiles.filter((profileItem, index) => index !== profiles.length - 1))
        // assert(profileI)
        await controls.start((item) => {
            return (item == profiles[profiles.length - 2] ? {
                y: 0,
                width: '100%'
            } : (item == profiles[profiles.length - 3] ? {
                y: 12,
                width: 'calc(100% - 48px)'
            } : {y: 24, width: 'calc(100% - 96px)'}))
        })
    }

    const [actionButtonsOpacity, setActionButtonsOpacity] = useState(1)
    const [chosenActionButtonOpacity, setChosenActionButtonOpacity] = useState(0)
    const [nextCardOpacity, setNextCardOpacity] = useState(1)
    const [chosenActionScale, setChosenActionScale] = useState(1)
    const [activeAction, setActiveAction] = useState<'like' | 'cancel'>('like')
    const { blockedUsers } = useDashboardStore()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleShortcuts = (e: { keyCode: number; }) => {
        if (e.keyCode == 37)
            cancelProfile().catch(err => console.error(err))
        else if (e.keyCode == 39)
            likeProfile().catch(err => console.error(err))
    }

    useEffect(() => {
        // console.log(event.)
        window.addEventListener('keydown', handleShortcuts)
        return () => {
            window.removeEventListener('keydown', handleShortcuts)
        }
    }, [handleShortcuts])

    x.on("change", latest => {
        if (latest < 0) setActiveAction('cancel')
        else setActiveAction('like')
    })

    const [profilesLoading, setProfilesLoading] = useState(true)
    // C4 — a failed fetch used to be caught only at the call site
    // (`.catch(console.log)`), so profilesLoading never reset and the deck
    // could spin forever with no indication anything went wrong.
    const [profilesError, setProfilesError] = useState<string | null>(null)
    // C5 — cursor pagination (see also useProfileFetcher.tsx's Explore
    // equivalent). Ordered by created_at since C6 removed the geohash bound
    // this used to piggyback its ordering on.
    const [profilesCursor, setProfilesCursor] = useState<QueryDocumentSnapshot | null>(null)
    const [hasMoreProfiles, setHasMoreProfiles] = useState(true)
    const [fetchingMoreProfiles, setFetchingMoreProfiles] = useState(false)
    const PROFILES_PAGE_SIZE = 20;

    const fetchDiscoverableProfiles = async (reset: boolean) => {
        if (reset) {
            setProfilesLoading(true);
            setProfilesCursor(null);
            setHasMoreProfiles(true);
        } else {
            if (!hasMoreProfiles || fetchingMoreProfiles) return;
            setFetchingMoreProfiles(true);
        }
        setProfilesError(null);

        if (!user || !loggedUserData) {
            console.error("User is not defined.");
            setProfilesLoading(false);
            setFetchingMoreProfiles(false);
            return;
        }

        try {
            const usersCollection = collection(db, 'users');
            const baseQuery = query(usersCollection, where("has_completed_onboarding", "==", true));

            // Add gender-specific filtering
            let finalQuery;
            const userGender = user.gender;

            if (user.meet === 2) {
                finalQuery = query(baseQuery, where("meet", "in", [2, userGender === "Male" ? 0 : 1]));
            } else if (user.meet === 0 || user.meet === 1) {
                const targetGender = user.meet === 0 ? "Male" : "Female";
                finalQuery = query(baseQuery, where("gender", "==", targetGender));
            } else {
                throw new Error("Invalid meet value provided.");
            }

            // C6: no geohash/radius bound — reach is unlimited by default, the
            // distance preference only ranks results (below), never excludes.
            finalQuery = query(finalQuery, orderBy('created_at'), limit(PROFILES_PAGE_SIZE));
            if (!reset && profilesCursor) {
                finalQuery = query(finalQuery, startAfter(profilesCursor));
            }

            const snapshot = await getDocs(finalQuery);
            setHasMoreProfiles(snapshot.docs.length === PROFILES_PAGE_SIZE);
            setProfilesCursor(snapshot.docs[snapshot.docs.length - 1] ?? null);

            const center: [number, number] | null =
                typeof loggedUserData.latitude === 'number' && typeof loggedUserData.longitude === 'number'
                    ? [loggedUserData.latitude, loggedUserData.longitude]
                    : null;

            const page: { profile: User; distanceMiles: number | null }[] = [];
            for (const doc of snapshot.docs
                .filter(doc => doc.get('is_banned') !== true)
                .filter(doc => doc.get('is_approved') === true)
                .filter(doc => {
                    const userSettings = doc.get('user_settings');
                    return userSettings && userSettings.public_search === true;
                })
            ) {
                const docData = doc.data() as User;
                if (
                    userLikes.every(like => like.liked_id !== docData.uid) &&
                    userDislikes.every(dislike => dislike.disliked_id !== docData.uid) &&
                    !blockedUsers.includes(docData.uid as string) &&
                    docData.uid !== user.uid
                ) {
                    const lat = doc.get('latitude');
                    const lng = doc.get('longitude');
                    const distanceMiles = center && typeof lat === 'number' && typeof lng === 'number'
                        ? distanceInMiles(center, [lat, lng])
                        : null;
                    page.push({ profile: docData, distanceMiles });
                }
            }
            // Nearer-first within the page (C6: a ranking signal, not a cut —
            // profiles with unknown coordinates aren't excluded, just sorted
            // after ones we can rank). Sorting is per-page rather than global
            // across the whole result set, since the server-side cursor orders
            // by created_at, not distance.
            page.sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
            const newProfiles = page.map(p => p.profile);

            setProfiles(prev => reset ? newProfiles : [...prev, ...newProfiles]);
        } catch (error) {
            console.error("Error fetching profiles:", error);
            setProfilesError(error instanceof Error ? error.message : "Something went wrong loading profiles.");
            if (reset) setProfiles([]);
        } finally {
            setProfilesLoading(false);
            setFetchingMoreProfiles(false);
        }
    };

    const saveUserLocationToFirebase = async (latitude: number, longitude: number) => {
        try {
            const userId = user?.uid;  // Get the current user's ID

            // Create a document reference for the user
            const userDocRef = doc(db, 'users', userId!);

			const geopoint = new GeoPoint(latitude, longitude)
            const geohash = geohashForLocation([latitude, longitude])
            const geography = { geohash , geopoint }

            // Save location data under the user document with merge option
            await setDoc(userDocRef, {
                location: geopoint,
                latitude, longitude,
                geohash: geohash,
                geography: geography
            }, { merge: true });

            updateUser({
                location: new GeoPoint(latitude, longitude),
                geohash: geohashForLocation([latitude, longitude]),
                latitude, longitude, geography: geography })
            setProfilesLoading(true)

        } catch (error) {
            console.error("Error saving location: ", error);
        }
    }

    useEffect(() => {
        if (profilesLoading && !likesLoading && !dislikesLoading) {
            fetchDiscoverableProfiles(true).catch((err: unknown) => console.log(err))
        }
    }, [profilesLoading, dislikesLoading, likesLoading])

    // C5 — top up the deck before it runs dry rather than waiting for it to
    // hit zero and show an empty state the user could otherwise never escape.
    useEffect(() => {
        if (!profilesLoading && hasMoreProfiles && !fetchingMoreProfiles && profiles.length > 0 && profiles.length <= 3) {
            fetchDiscoverableProfiles(false).catch((err: unknown) => console.log(err))
        }
    }, [profiles.length, profilesLoading, hasMoreProfiles, fetchingMoreProfiles])

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                saveUserLocationToFirebase(latitude, longitude).catch(err => console.log(err));
            }, function (error) {
                console.error("Error getting location: ", error);
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }, [])
    return (
        <>
            {verificationModals}
            <nav className="dashboard-layout__mobile-top-nav">
                <div className="dashboard-layout__moblie-top-nav__logo"></div>
                <div className="icons">
                    <img src="/assets/icons/notification.svg" alt={``}/>
                    <img src="/assets/icons/control.svg" alt={``}/>
                </div>
            </nav>
            <AnimatePresence mode="sync">
                {!profilesLoading && profiles.length !== 0 &&
                    <motion.div key={'index'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="swipe-and-match-page">
                        <motion.div style={{ opacity: chosenActionButtonOpacity, scale: chosenActionScale }} className="chosen-action-button">
                            {activeAction == 'cancel' && <img src="/assets/icons/cancel.svg" alt={``} />}
                            {activeAction == 'like' && <img src="/assets/icons/heart.svg" alt={``} />}
                        </motion.div>
                        {profiles.map((item, index) =>
                            <>
                                <motion.div
                                    key={index}
                                    style={{opacity: actionButtonsOpacity}}
                                    className="action-buttons">
                                    {/*{profiles.length}*/}
                                    <button data-cy="dislike-profile" onClick={() => {
                                        setSwipedUser(item?.uid as string)
                                        setActionType('cancel');
                                    }} className="action-buttons__button">
                                        <img src="/assets/icons/cancel.svg" alt={``}/>
                                    </button>
                                    <button data-cy="like-profile" onClick={() => {
                                        if (!requireVerification()) return;
                                        setSwipedUser(item?.uid as string)
                                        setActionType('like');
                                    }} className="action-buttons__button">
                                        <img src="/assets/icons/heart.svg" alt={``}/>
                                    </button>
                                    <button data-cy="chat-profile" className="action-buttons__button action-buttons__button--small"
                                        onClick={() => {
                                            if (!requireVerification()) return;
                                            loggedUserData?.is_premium ?
                                                navigate(`/dashboard/chat?recipient-user-id=${item.uid}`) :
                                                toast.error('Upgrade to premium to chat');
                                            console.log(loggedUserData)}}
                                    >
                                        <img src="/assets/icons/message-heart.svg" alt={``}/>
                                    </button>
                                </motion.div>
                                {/* @ts-expect-error type errors */}
                                <ProfileCard key={uid(item)} controls={controls} profiles={profiles} setProfiles={setProfiles} item={item} setActiveAction={setActiveAction} setActionButtonsOpacity={setActionButtonsOpacity} setChosenActionButtonOpacity={setChosenActionButtonOpacity} setChosenActionScale={setChosenActionScale} requireVerification={requireVerification} index={index} nextCardOpacity={nextCardOpacity} setNextCardOpacity={setNextCardOpacity}/></>)}
            </motion.div>
            }

            {!profilesLoading && profilesError &&
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
                            className="w-full h-full flex items-center justify-center flex-col dashboard-layout__main-app__body">
                    <DiscoveryStateMessage
                        title="Couldn't load profiles"
                        subtitle={profilesError}
                        actionLabel="Try again"
                        onAction={() => fetchDiscoverableProfiles(true).catch((err: unknown) => console.log(err))}
                    />
                </motion.div>
            }

            {!profilesLoading && !profilesError && profiles.length === 0 &&
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
                            className="w-full h-full flex items-center justify-center flex-col dashboard-layout__main-app__body">
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.15}}
                                key={'empty-state'} exit={{opacity: 0}} className="matches-page__empty-state">
                        <img className="" src="/assets/icons/like-empty-state.png" alt={``}/>
                        <p className="matches-page__empty-state-text">No New Profiles Right Now</p>
                        </motion.div>
                    </motion.div>
                }

                {profilesLoading && <motion.div className="w-full h-full flex items-center justify-center flex-col dashboard-layout__main-app__body">
                    <Lottie animationData={Cat} className="h-[150px]" />
                    <p className="text-[2rem] font-medium">Finding Nearby Profiles</p>
                    <p className="text-[1.2rem] mt-[1.2rem]">Please give us permission to access your location</p>
                </motion.div>}
            </AnimatePresence>
        </>
    )
}

export default SwipingAndMatching