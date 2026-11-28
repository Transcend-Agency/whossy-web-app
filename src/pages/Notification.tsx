import DashboardPageContainer from '@/components/dashboard/DashboardPageContainer'
import { db } from '@/firebase';
import {motion} from 'framer-motion';
import { useAuthStore } from '@/store/UserId';
import {collection, doc, getDoc, onSnapshot, writeBatch} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notifications } from '@/types/notification';
import useDashboardStore from "@/store/useDashboardStore.tsx";
import SelectedProfileView from "@/components/dashboard/SelectedProfileView.tsx";
import useProfileFetcher from "@/hooks/useProfileFetcher.tsx";
import SkeletonNotification from "@/components/dashboard/SkeletonNotification.tsx";
import {User} from "@/types/user.ts";
import {useChatIdStore} from "@/store/ChatStore.tsx";
import { pressable } from '@/utils/pressable';

// The "other user" a notification is about, when it's about one — used both
// to filter out notifications about a since-banned/blocked profile and to
// know who to open on tap. 'verification' has no other user; it's about the
// viewer's own submission, so it's never filtered this way.
const subjectUserId = (notification: Notifications, viewerUid?: string | null): string | undefined => {
    switch (notification.type) {
        case 'like':
            return notification.likerId;
        case 'match':
            return notification.user2_id === viewerUid ? notification.user1_id : notification.user2_id;
        case 'message':
            return notification.senderId;
        case 'verification':
            return undefined;
    }
};

// Profiles of the people notifications are about. Ten notifications from the
// same sender used to mean ten reads of the same profile, run one after the
// other, every time the list changed. Cached at module level so reopening
// the page reuses them; the TTL bounds how long a since-banned profile can
// keep showing.
const USER_CACHE_TTL_MS = 5 * 60 * 1000;
const userCache = new Map<string, { at: number; promise: Promise<User | null> }>();

const readUser = async (userId: string): Promise<User | null> => {
    try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) return snap.data() as User;
        console.warn("No user found for userId:", userId);
        return null;
    } catch (error) {
        console.error("Error fetching user data for userId:", userId, error);
        return null;
    }
};

const fetchUserCached = (userId: string): Promise<User | null> => {
    const hit = userCache.get(userId);
    if (hit && Date.now() - hit.at < USER_CACHE_TTL_MS) return hit.promise;
    const promise = readUser(userId);
    userCache.set(userId, { at: Date.now(), promise });
    // A failed read shouldn't stick for five minutes.
    promise.then((u) => { if (!u) userCache.delete(userId); });
    return promise;
};

// Last list shown per viewer, so reopening the page paints straight away
// instead of flashing the skeleton while the live listener catches up.
const lastShown = new Map<string, Notifications[]>();

// Firestore caps a write batch at 500 operations.
const BATCH_LIMIT = 500;

const Notification = () => {
    const {auth} = useAuthStore();
    const navigate = useNavigate();
    const { setChatId } = useChatIdStore();
    const { selectedProfile, setSelectedProfile } = useDashboardStore()
    const { refreshProfiles } = useProfileFetcher()
    const { user } = useAuthStore()
    const loggedUserId = auth?.uid as string;

    const [notifications, setNotifications] = useState<Notifications[]>(() => lastShown.get(loggedUserId) ?? []);
    const [loading, setLoading] = useState<boolean>(() => !lastShown.has(loggedUserId));
    // Notifications that were unread when this visit saw them. Opening the
    // page marks everything read (which clears the bell badge), but the dot
    // stays on these until the user leaves so they can still tell what's new.
    const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
    const markingRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!loggedUserId) return;
        let cancelled = false;
        // Each snapshot starts an async filter pass; only the newest one may
        // write state, or a slow older pass can overwrite a newer list.
        let latestRun = 0;

        // Everything unread is marked read as soon as the page sees it,
        // including notifications filtered out of the list (banned/blocked
        // subjects) — the bell counts those too, so tapping one by one could
        // never clear it.
        const markAllSeen = (all: Notifications[]) => {
            const unseen = all.filter((n) => !n.seen && !markingRef.current.has(n.id));
            if (unseen.length === 0) return;
            setNewIds((prev) => {
                const next = new Set(prev);
                unseen.forEach((n) => next.add(n.id));
                return next;
            });
            for (let i = 0; i < unseen.length; i += BATCH_LIMIT) {
                const chunk = unseen.slice(i, i + BATCH_LIMIT);
                const batch = writeBatch(db);
                chunk.forEach((n) => {
                    markingRef.current.add(n.id);
                    batch.update(doc(db, `users/${loggedUserId}/notifications`, n.id), { seen: true });
                });
                batch.commit().catch((error) => {
                    console.error("Error marking notifications seen:", error);
                    // Let the next snapshot retry them.
                    chunk.forEach((n) => markingRef.current.delete(n.id));
                });
            }
        };

        const notificationRef = collection(db, `users/${loggedUserId}/notifications`);
        const unSub = onSnapshot(
            notificationRef,
            async (snapshot) => {
                const run = ++latestRun;
                const all = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                })) as Notifications[];

                markAllSeen(all);

                // One fresh read of the viewer for their block list (it can
                // change while the page is open), and the subjects in
                // parallel from the cache.
                const currentUserPromise = readUser(loggedUserId);
                const results = await Promise.all(all.map(async (notification) => {
                    const userId = subjectUserId(notification, loggedUserId);
                    if (!userId) {
                        // 'verification' (or a malformed doc with neither) — always shown.
                        return notification.type === 'verification' ? notification : null;
                    }
                    const [userData, currentUser] = await Promise.all([fetchUserCached(userId), currentUserPromise]);
                    if (userData && userData.is_approved && currentUser && !currentUser.blockedIds?.includes(userId)) {
                        return notification;
                    }
                    return null;
                }));
                if (cancelled || run !== latestRun) return;

                const filtered = results.filter((n): n is Notifications => n !== null);
                filtered.sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0));
                lastShown.set(loggedUserId, filtered);
                setNotifications(filtered);
                setLoading(false);
            },
            (err) => {
                console.log(err);
                setLoading(false);
            }
        );

        return () => {
            cancelled = true;
            unSub();
        };
    }, [loggedUserId]);

    const isNew = (notification: Notifications) => !notification.seen || newIds.has(notification.id);

    const openNotification = async (notification: Notifications) => {
        switch (notification.type) {
            case 'like':
                setSelectedProfile(notification.likerId as string);
                return;
            case 'match':
                setSelectedProfile(subjectUserId(notification, user?.uid) as string);
                return;
            case 'message': {
                if (!notification.chatId || !notification.senderId) return;
                const senderData = await fetchUserCached(notification.senderId);
                if (!senderData) return;
                setChatId(notification.chatId);
                navigate(`/dashboard/chat?recipient-user-id=${notification.senderId}`, {
                    state: { chatId: notification.chatId, recipientUser: senderData },
                });
                return;
            }
            case 'verification':
                navigate('/dashboard/user-profile');
                return;
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
                        notifications.map((notification) =>
                            notification.type === 'like' ? (
                                <div
                                    className='flex justify-between pb-[1.2rem] cursor-pointer'
                                    style={{borderBottom: '1px solid #ECECEC'}}
                                    key={notification.id}
                                    onClick={() => openNotification(notification)}
                                >
                                    <div className='space-y-[1.2rem]'>
                                        <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>
                                            New Like {isNew(notification) &&
                                            <div className='size-[0.8rem] bg-[#F2243E] rounded-full'/>}
                                        </h1>
                                        <p className='text-[1.6rem] text-[#8A8A8E]'>
                                            {notification.body || 'Someone new liked your profile. Check it out now.'}
                                        </p>
                                    </div>
                                    <img
                                        src={notification.likerProfilePicture}
                                        className='size-[4.8rem] object-cover rotate-6 rounded-[1.2rem]'
                                        alt=''
                                    />
                                </div>
                            ) : notification.type === 'match' ? (
                                <div key={notification.id} {...pressable(() => openNotification(notification))} className='flex justify-between pb-[1.2rem] cursor-pointer'
                                     style={{borderBottom: '1px solid #ECECEC'}}>
                                    <div className='space-y-[1.2rem]'>
                                        <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>
                                            You've matched
                                            with {notification.user2_name === user?.first_name ? notification.user1_name : notification.user2_name}{' '}
                                            {isNew(notification) &&
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
                            ) : notification.type === 'message' ? (
                                <div
                                    className='flex justify-between pb-[1.2rem] cursor-pointer'
                                    style={{borderBottom: '1px solid #ECECEC'}}
                                    key={notification.id}
                                    onClick={() => openNotification(notification)}
                                >
                                    <div className='space-y-[1.2rem]'>
                                        <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>
                                            {notification.senderName ? `Message from ${notification.senderName}` : 'New Message'} {isNew(notification) &&
                                            <div className='size-[0.8rem] bg-[#F2243E] rounded-full'/>}
                                        </h1>
                                        <p className='text-[1.6rem] text-[#8A8A8E]'>
                                            {notification.body || 'You have a new message.'}
                                        </p>
                                    </div>
                                    {notification.senderProfilePicture &&
                                        <img
                                            src={notification.senderProfilePicture}
                                            className='size-[4.8rem] object-cover rotate-6 rounded-[1.2rem]'
                                            alt=''
                                        />}
                                </div>
                            ) : (
                                <div
                                    className='flex justify-between pb-[1.2rem] cursor-pointer'
                                    style={{borderBottom: '1px solid #ECECEC'}}
                                    key={notification.id}
                                    onClick={() => openNotification(notification)}
                                >
                                    <div className='space-y-[1.2rem]'>
                                        <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>
                                            {notification.title} {isNew(notification) &&
                                            <div className='size-[0.8rem] bg-[#F2243E] rounded-full'/>}
                                        </h1>
                                        <p className='text-[1.6rem] text-[#8A8A8E]'>
                                            {notification.body}
                                        </p>
                                    </div>
                                </div>
                            )
                        )
                    )}
                </main>
            </motion.div>
        </DashboardPageContainer>) :
            <SelectedProfileView
                onBackClick={() => {
                    setSelectedProfile(null)
                }}
                onBlockChange={refreshProfiles}/>
        }
    </>
    )
}

export default Notification
