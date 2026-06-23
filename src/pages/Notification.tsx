import DashboardPageContainer from '@/components/dashboard/DashboardPageContainer'
import { db } from '@/firebase';
import {motion} from 'framer-motion';
import { useAuthStore } from '@/store/UserId';
import {collection, doc, getDoc, onSnapshot, updateDoc} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Notifications } from '@/types/notification';
import useDashboardStore from "@/store/useDashboardStore.tsx";
import ViewProfile from "@/components/dashboard/ViewProfile.tsx";
import useProfileFetcher from "@/hooks/useProfileFetcher.tsx";
import SkeletonNotification from "@/components/dashboard/SkeletonNotification.tsx";
import {User} from "@/types/user.ts";

const Notification = () => {
    const {auth} = useAuthStore();
    const { profiles, selectedProfile, setSelectedProfile } = useDashboardStore()
    const { refreshProfiles } = useProfileFetcher()
    const { user } = useAuthStore()
    const loggedUserId = auth?.uid as string;
    const [loading, setLoading] = useState<boolean>(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        setLoading(true); // Start loading
        const notificationRef = collection(db, `users/${loggedUserId}/notifications`);
        const unSub = onSnapshot(
            notificationRef,
            async (snapshot) => {
                const notifications = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Notifications[];

                const filteredNotifications = [];
                for (const notification of notifications) {
                    try {
                        const id = notification.user2_id === user?.uid ? notification.user1_id : notification.user2_id
                        const userId = notification.likerId || id
                        if (userId) {
                            const userData = await fetchUserData(userId);
                            const currentUser = await fetchUserData(user?.uid as string)
                            if (userData && userData.is_approved && currentUser && !currentUser.blockedIds?.includes(userId)) {
                                filteredNotifications.push(notification);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching user data for notification:", notification.id, error);
                    }
                }
                setNotifications(filteredNotifications);
                setLoading(false);
            },
            (err) => {
                console.log(err);
                setLoading(false);
            }
        );
        return () => {
            unSub();
        };
    }, [loggedUserId]);

    const fetchUserData = async (userId: string) => {
        if (!userId) {
            return null;
        }

        try {
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                return userDocSnap.data() as User;
            } else {
                console.warn("No user found for userId:", userId);
                return null;
            }
        } catch (error) {
            console.error("Error fetching user data for userId:", userId, error);
            return null;
        }
    };

    return (
    <>
        { !selectedProfile ? (
        <DashboardPageContainer className="block">
            <motion.div animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }} className='user-profile dashboard-layout__main-app__body__main-page '>
                <button className='w-full flex items-center pb-[1.6rem] px-[2.4rem] gap-[1.2rem] cursor-pointer hover:scale-[1.02] active:scale-[0.95] transition duration-300' style={{borderBottom: '1px solid #ECECEC'}} onClick={() => window.history.back()} >
                    <img src="/assets/icons/back-arrow-black.svg" alt="" />
                    <span className='text-[1.8rem]'>Notifications</span>
                </button>
                <main className='px-[2.4rem] py-[1.6rem] space-y-[2rem]'>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, index) => (
                                <div key={index} className="flex flex-col justify-center items-center w-[100%]">
                                    <SkeletonNotification height="5.2rem" width="100%" borderRadius="0.5rem"/>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className='grid items-center text-center place-items-center text-3xl gap-8 pt-[20rem]'>
                            <img className='size-[50px]' src='/assets/icons/like-empty-state.png' alt=''/>
                            <p className='text-[2rem]'>
                                No Notifications Yet 🫠 <br/> Get to Matching and liking real quick 😍
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification: Notifications, i) =>
                            notification.title === 'Like' ? (
                                <div
                                    className='flex justify-between pb-[1.2rem] cursor-pointer'
                                    style={{borderBottom: '1px solid #ECECEC'}}
                                    key={i}
                                    onClick={async () => {
                                        setSelectedProfile(notification.likerId as string);
                                        const userDocRef = doc(db, `users/${loggedUserId}/notifications`, notification.id);
                                        await updateDoc(userDocRef, {seen: true})
                                    }}
                                >
                                    <div className='space-y-[1.2rem]'>
                                        <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>
                                            New Like {!notification.seen &&
                                            <div className='size-[0.8rem] bg-[#F2243E] rounded-full'/>}
                                        </h1>
                                        <p className='text-[1.6rem] text-[#8A8A8E]'>
                                            Someone new liked your profile. Check it out now.
                                        </p>
                                    </div>
                                    <img
                                        src={notification.likerProfilePicture}
                                        className='size-[4.8rem] object-cover rotate-6 rounded-[1.2rem]'
                                        alt=''
                                    />
                                </div>
                            ) : (
                                <div onClick={async () => {
                                    setSelectedProfile(notification.user2_id === user?.uid ? notification.user1_id : notification.user2_id as string);
                                    const userDocRef = doc(db, `users/${loggedUserId}/notifications`, notification.id);
                                    await updateDoc(userDocRef, {seen: true})
                                }} className='flex justify-between pb-[1.2rem] cursor-pointer'
                                     style={{borderBottom: '1px solid #ECECEC'}}>
                                    <div className='space-y-[1.2rem]'>
                                        <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>
                                            You've matched
                                            with {notification.user2_name === user?.first_name ? notification.user1_name : notification.user2_name}{' '}
                                            {!notification.seen &&
                                                <div className='size-[0.8rem] bg-[#F2243E] rounded-full'/>}
                                        </h1>
                                        <p className='text-[1.6rem] text-[#8A8A8E]'>
                                            Message {notification.user2_name === user?.first_name ? notification.user1_name : notification.user2_name} to
                                            know more about them.
                                        </p>
                                    </div>
                                    <div className='relative'>
                                        { /* @ts-expect-error might be bull */}
                                        <img src={notification.user2_pic === user?.photos[0] as string ? notification.user1_pic : notification.user2_pic} className='size-[4.8rem] object-cover -rotate-6 rounded-[1.2rem]' alt=''
                                        />
                                        { /* @ts-expect-error might be bull */}
                                        <img src={notification.user2_pic === user?.photos[0] as string ? notification.user1_pic : notification.user2_pic} className='size-[4.8rem] absolute top-0 rotate-12 object-cover rounded-[1.2rem] translate-y-4 translate-x-4' style={{border: '0.3rem solid #FFFFFF'}}
                                            alt=''
                                        />
                                    </div>
                                </div>
                            )
                        )
                    )}
                </main>
            </motion.div>
        </DashboardPageContainer>) :
            <ViewProfile
                onBackClick={() => {
                    setSelectedProfile(null)
                }}
                userData={profiles.find(profile => selectedProfile as string == profile.uid)!}
                onBlockChange={refreshProfiles}/>
        }
    </>
    )
}

export default Notification