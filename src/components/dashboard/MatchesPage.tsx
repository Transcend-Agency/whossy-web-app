import useSyncPeopleWhoLikedUser from "@/hooks/useSyncPeopleWhoLikedUser";
import useSyncUserMatches from "@/hooks/useSyncUserMatches";
import { useAuthStore } from "@/store/UserId";
import { AnimatePresence, motion } from "framer-motion";
import {useEffect, useState} from "react";
import Skeleton from "react-loading-skeleton";
import DashboardPageContainer from "./DashboardPageContainer";
import { MatchItem } from "./MatchesSide";
import useDashboardStore from "@/store/useDashboardStore";
import ViewProfile from "./ViewProfile";
import useProfileFetcher from "@/hooks/useProfileFetcher";
import SubscriptionPlans from "@/pages/dashboard/SubscriptionPlans.tsx";
import {User} from "@/types/user.ts";
import { getUserProfile } from '@/hooks/useUser';
import {useNavigationStore} from "@/store/NavigationStore.tsx";
import useSyncPeopleWhoUserLiked from "@/hooks/useSyncPeopleWhoUserLiked.tsx";

const MatchesPage = () => {
    const [activePage, setActivePage] = useState<'profile' | 'like' | 'match' | 'liked-by' | 'plans'>('like')
    // const [likes] = useState([1, 2, 3, 4, 5])
    const [currentPlan, setCurrentPlan] = useState<'free' | 'premium'>('free');
    const [userData, setUserData] = useState<User>();
    const { auth, user } = useAuthStore()
    const { matches, loading: matchesLoading } = useSyncUserMatches(auth?.uid as string)
    const { peopleWhoLiked, loading: likesLoading } = useSyncPeopleWhoLikedUser()
    const { peopleYouLiked, loading: likedByLoading } = useSyncPeopleWhoUserLiked();
    const { profiles,  selectedProfile,  setSelectedProfile } = useDashboardStore()
    const { refreshProfiles } = useProfileFetcher()
    const { setActivePage: setPage } = useNavigationStore()

    useEffect(() => {
        setPage('user-profile')
    }, []);

    const fetchUserData = async () => {
        try {
            const data = await getUserProfile("users", auth?.uid as string) as User;
            setUserData(data);
        } catch (err) {
            console.log("Error fetching user data:", err);
        }
    };
    const refetchUserData = async () => { await fetchUserData() }

    useEffect(() => {
        fetchUserData().catch(err => console.log(err));
        if(location.pathname === "/dashboard/matches"){
            return
        }else{
            setSelectedProfile(null)
            console.log("I am getting here, profile:", selectedProfile)
            return () => setSelectedProfile(null)
        }
    }, [])

    const LikedByEmptyState = () => {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} key={'empty-state'} exit={{ opacity: 0 }} className="matches-page__empty-state">
                <img className="" src="/assets/icons/like-empty-state.png" alt={``} />
                <p className="matches-page__empty-state-text">You have not liked any profile</p>
            </motion.div>
        )
    }
    const LikesEmptyState = () => {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} key={'empty-state'} exit={{ opacity: 0 }} className="matches-page__empty-state">
                <img className="" src="/assets/icons/like-empty-state.png" alt={``} />
                <p className="matches-page__empty-state-text">No one has liked your profile</p>
            </motion.div>
        )
    }
    const MatchesEmptyState = () => {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} key={'empty-state'} exit={{ opacity: 0 }} className="matches-page__empty-state">
                <img className="" src="/assets/images/dashboard/no-matches.png" alt={``} />
                <p className="matches-page__empty-state-text text-center">No one has matched with you ^_^</p>
            </motion.div>
        )
    }

    return (
        <>
            {!selectedProfile && <DashboardPageContainer className="matches-page" span={1}>
                <div className={`${activePage === "plans" ? "hidden" : `matches-page__nav `}`}>
                    <div className="left-nav">
                        <button data-cy="likes-page" onClick={() => setActivePage('like')}
                                className={`matches-page__nav-item ${activePage === 'like' && 'matches-page__nav-item--active'}`}>Liked Me
                        </button>
                        <button data-cy="matches-page" onClick={() => setActivePage('match')}
                                className={`matches-page__nav-item ${activePage === 'match' && 'matches-page__nav-item--active'}`}>Matches
                        </button>
                        <button data-cy="liked-by-page" onClick={() => setActivePage('liked-by')}
                                className={`matches-page__nav-item ${activePage === 'liked-by' && 'matches-page__nav-item--active'}`}>Likes
                        </button>
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    {activePage == 'like' &&
                        <motion.div initial={{opacity: 0, scale: 0.96}} animate={{opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} key={'like'} exit={{ opacity: 0, scale: 0.96 }} className="matches-page__likes-container h-screen lg:h-auto">
                        <AnimatePresence mode="wait">
                            {/*{likes.length == 0 && <LikesEmptyState />}*/}
                            {peopleWhoLiked.length == 0 && !likesLoading &&
                                <LikesEmptyState />}
                            {likesLoading && <motion.div key="matches-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {!user?.is_premium && <div className="px-[2.4rem] h-[13.6rem] mt-[1.6rem]">
                                    <Skeleton containerClassName="rounded-[1.2rem] overflow-hidden h-full block" width={'100%'} height={"100%"} />
                                </div>}
                                <div className="matches-page__grid">
                                    {
                                        [1, 2, 3, 4, 5, 6].map((item =>
                                            <Skeleton key={item} containerClassName='matches__matched-profiles' width={'100%'} height={"100%"} />
                                        ))
                                    }
                                </div>
                            </motion.div>}

                            {!likesLoading && peopleWhoLiked.length !== 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {!user?.is_premium && <div className="likes-subscribe-cta-container">
                                    <div data-cy="subscribe-modal-cta" className="likes-subscribe-cta">
                                        <figure className="likes-subscribe-cta__image">
                                            <img src="/assets/images/matches/stephen.png" alt={``} />
                                            <div className="likes-subscribe-cta__overlay">
                                                <div className="likes-subscribe-cta__total-likes">
                                                    <span>{peopleWhoLiked.length}</span>
                                                    <img src="/assets/icons/white-likes.svg" alt={``} />
                                                </div>
                                                <img src="/assets/icons/likes-banner.svg" className="likes-subscribe-cta__likes-banner" alt={``} />
                                            </div>
                                        </figure>
                                        <div className="likes-subscribe-cta__text">
                                            <p>Subscribe to Premium to Chat Who Liked You</p>
                                            <button onClick={() => { setCurrentPlan('free')
                                                setActivePage('plans')
                                            } } className="likes-subscribe-cta__upgrade-button cursor-pointer">UPGRADE</button>
                                        </div>
                                    </div>
                                </div>}
                                { <div className="matches-page__grid">
                                    {peopleWhoLiked?.map((like, i,) =>
                                        <div key={i}>
                                            <MatchItem
                                                userData={like.liker}
                                            />
                                        </div>
                                    )}
                                </div>}
                            </motion.div>}
                        </AnimatePresence>

                    </motion.div>}
                    {activePage == 'liked-by' &&
                        <motion.div initial={{opacity: 0, scale: 0.96}} animate={{opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} key={'like'} exit={{ opacity: 0, scale: 0.96 }} className="matches-page__likes-container h-screen lg:h-auto">
                            <AnimatePresence mode="wait">
                                {/*{likes.length == 0 && <LikesEmptyState />}*/}
                                {peopleYouLiked.length == 0 && !likedByLoading &&
                                    <LikedByEmptyState /> }
                                {likedByLoading && <motion.div key="matches-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {!user?.is_premium && <div className="px-[2.4rem] h-[13.6rem] mt-[1.6rem]">
                                        <Skeleton containerClassName="rounded-[1.2rem] overflow-hidden h-full block" width={'100%'} height={"100%"} />
                                    </div>}
                                    <div className="matches-page__grid">
                                        {
                                            [1, 2, 3, 4, 5, 6].map((item =>
                                                    <Skeleton key={item} containerClassName='matches__matched-profiles' width={'100%'} height={"100%"} />
                                            ))
                                        }
                                    </div>
                                </motion.div>}

                                {!likedByLoading && peopleYouLiked.length !== 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {!user?.is_premium && <div className="likes-subscribe-cta-container">
                                        <div data-cy="subscribe-modal-cta" className="likes-subscribe-cta">
                                            <figure className="likes-subscribe-cta__image">
                                                <img src="/assets/images/matches/stephen.png" alt={``} />
                                                <div className="likes-subscribe-cta__overlay">
                                                    <div className="likes-subscribe-cta__total-likes">
                                                        <span>{peopleYouLiked.length}</span>
                                                        <img src="/assets/icons/white-likes.svg" alt={``} />
                                                    </div>
                                                    <img src="/assets/icons/likes-banner.svg" className="likes-subscribe-cta__likes-banner" alt={``} />
                                                </div>
                                            </figure>
                                            <div className="likes-subscribe-cta__text">
                                                <p>Subscribe to Premium to Chat Who Liked You</p>
                                                <button onClick={() => { setCurrentPlan('free')
                                                    setActivePage('plans')
                                                } } className="likes-subscribe-cta__upgrade-button cursor-pointer">UPGRADE</button>
                                            </div>
                                        </div>
                                    </div>}
                                    <div className="matches-page__grid">
                                        {/*{peopleYouLiked?.map(like => (*/}
                                        {/*    console.log(like)*/}
                                        {/*))}*/}
                                        {peopleYouLiked?.map((like, i,) =>
                                            <div key={i}>
                                                <MatchItem
                                                    userData={like.liked as User}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>}
                            </AnimatePresence>

                        </motion.div>}
                    {activePage == 'match' && <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} key={'match'} exit={{ opacity: 0, scale: 0.96 }} className="matches-page__matches-container h-screen lg:h-auto">

                        <AnimatePresence mode="wait">
                            {matches.length == 0 && !matchesLoading &&
                                <MatchesEmptyState />}
                            {matchesLoading && <motion.div key="matches-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {!user?.is_premium && <div className="px-[2.4rem] h-[13.6rem] mt-[1.6rem]">
                                    <Skeleton containerClassName="rounded-[1.2rem] overflow-hidden h-full block" width={'100%'} height={"100%"} />
                                </div>}
                                <div className="matches-page__grid">
                                    {
                                        [1, 2, 3, 4, 5, 6].map((item =>
                                            <Skeleton key={item} containerClassName='matches__matched-profiles' width={'100%'} height={"100%"} />
                                        ))
                                    }
                                </div>
                            </motion.div>}
                            {!matchesLoading && matches.length !== 0 && <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                                {!user?.is_premium && <div className="matches-subscribe-cta-container">
                                    <div className="matches-subscribe-cta">
                                        <div className="matches-subscribe-cta__grid">
                                            <div className="matches-subscribe-cta__text-container">
                                                <div className="matches-subscribe-cta__text">
                                                    <p>Upgrade to Premium to Chat New Matches</p>
                                                    <button onClick={() => { setCurrentPlan('free')
                                                        setActivePage('plans')
                                                    } } className="matches-subscribe-cta__upgrade-button cursor-pointer">UPGRADE</button>
                                                </div>
                                            </div>
                                            <div className="matches-subscribe-cta__image">
                                                <img src="/assets/icons/fire.svg" />
                                            </div>
                                        </div>
                                    </div>
                                </div>}

                                {matches.length !== 0 && <div className="matches-page__grid">
                                    {matches.map((match, i) =>
                                        <div key={i}>
                                            <MatchItem userData={match.matchedUserData} />
                                        </div>
                                    )}
                                </div>}

                            </motion.div>}
                        </AnimatePresence>


                    </motion.div>}
                    { activePage == 'plans' &&
                        <SubscriptionPlans currentPlan={currentPlan}
                                           activePage={activePage == 'plans'}
                                           closePage={() => setActivePage('like')}
                                           userData={userData as User}
                                           refetchUserData={refetchUserData}
                        /> }
                </AnimatePresence>
            </DashboardPageContainer> }
            {selectedProfile &&
                <ViewProfile
                onBackClick={() => { setSelectedProfile(null) }}
                userData={profiles.find(profile => selectedProfile as string == profile.uid)!}
                onBlockChange={refreshProfiles}
            />}
        </>
    )
}

export default MatchesPage;