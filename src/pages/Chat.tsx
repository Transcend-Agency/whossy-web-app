import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {collection, doc, getDoc, getDocs, onSnapshot, orderBy, query} from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/store/UserId';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardPageContainer from '@/components/dashboard/DashboardPageContainer';
import SelectedChat from '@/components/dashboard/SelectedChat';
import { ChatListItem, ChatListItemLoading } from '@/components/dashboard/ChatListItem';
import { User } from '@/types/user';
import {Chat, Messages} from '@/types/chat';
import { useChatIdStore } from '@/store/ChatStore';
import { getUserProfile } from '@/hooks/useUser';
import ViewProfile from "@/components/dashboard/ViewProfile";
import useDashboardStore from "@/store/useDashboardStore";
import useProfileFetcher from "@/hooks/useProfileFetcher";
import {useMatchStore} from "@/store/Matches.tsx";
import useSyncPeopleWhoLikedUser from "@/hooks/useSyncPeopleWhoLikedUser.tsx";
import {useNavigationStore} from "@/store/NavigationStore.tsx";

interface ChatDataWithUserData extends Chat {
    user: User;
    message?: string
}

const ChatPage = () => {
    const [activePage, setActivePage] = useState<'chats' | 'selected-chat'>('chats');
    const navigate = useNavigate();
    const location = useLocation();
    const { setChatId } = useChatIdStore();
    const { auth } = useAuthStore();
    const currentUserId = auth?.uid as string;
    const { selectedProfile, setSelectedProfile, profiles } = useDashboardStore();
    const { refreshProfiles } = useProfileFetcher();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allChats, setAllChats] = useState<ChatDataWithUserData[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const { matches } = useMatchStore()
    const { peopleWhoLiked } = useSyncPeopleWhoLikedUser()
    const { setActivePage: setPage } = useNavigationStore()

    const fetchLoggedUserData = async () => {
        setChatId(null)
        try {
            const data = await getUserProfile("users", currentUserId) as User;
            setCurrentUser(data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

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

    const fetchUserChats = async (id: string) => {
        const chatDocRef = doc(db, "chats", id);
        const chatDocSnap = await getDoc(chatDocRef);
        return chatDocSnap.exists() ? chatDocSnap.data() as Chat : null;
    };

    useEffect(() => {
        setSelectedProfile(null)
        setPage('user-profile')
        fetchLoggedUserData();
        return () => setSelectedProfile(null)
    }, []);

    useEffect(() => {
        let isMounted = true;
        setIsLoadingChats(true);

        const getLastValidMessage = async (chat: Chat, currentUserUid: string) => {
            const chatId = `${chat.participants.sort().join('_')}`;
            const messagesRef = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp", "desc"));
            try {
                const messagesSnap = await getDocs(messagesRef);
                const messages = messagesSnap.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                })) as Messages[];
                const validMessage = messages.find(
                    (msg) => !msg.sender_id_blocked || msg.sender_id === currentUserUid
                );
                return validMessage ? validMessage.message : null;
            } catch (error) {
                console.error("Error fetching messages:", error);
                return "Error loading message";
            }
        };

        const unSub = onSnapshot(collection(db, "chats"), async (snapshot) => {
            if (!isMounted) return;

            const chatIds: string[] = snapshot.docs
                .map((doc) => doc.id)
                .filter((id) => id.includes(currentUserId));

            const userChats = await Promise.all(
                chatIds.map(async (chatId) => {
                    const chat = await fetchUserChats(chatId);
                    if (!chat || !chat.participants || chat.participants.length < 2) {
                        console.warn("Invalid chat data:", chat);
                        return null;
                    }
                    return chat;
                })
            );

            const chatDataWithUserData = await Promise.all(
                userChats
                    .filter(chat => chat !== null)
                    .map(async (chat) => {
                        const recipientId = chat?.participants.find(participant => participant !== currentUserId);
                        const recipientUserData = await fetchUserData(recipientId!);

                        if (!recipientUserData || recipientUserData.is_banned) {
                            console.warn("Skipping chat due to missing user data:", chat);
                            return null;
                        }
                        const lastMessage = await getLastValidMessage(chat, currentUserId);
                        return { ...chat, user: recipientUserData, message: lastMessage  };
                    })
            );

            const filteredChats = chatDataWithUserData
                .filter(chat => chat !== null)
                .filter(chat =>
                        chat.last_sender_id !== null ||
                        chat.last_message !== null ||
                        chat.message as string !== null
                    ) as ChatDataWithUserData[];

            const sortedChats = filteredChats.sort((a, b) => {
                // @ts-ignore
                const aTimestamp = a.last_message_timestamp?.seconds || 0;
                // @ts-ignore
                const bTimestamp = b.last_message_timestamp?.seconds || 0;
                return bTimestamp - aTimestamp;
            });

            if (isMounted) setAllChats(sortedChats);
            setIsLoadingChats(false);
        });

        return () => {
            isMounted = false;
            unSub();
        };
    }, [currentUserId]);

    const queryParams = new URLSearchParams(location.search);
    const recipientUserId = queryParams.get('recipient-user-id');

    useEffect(() => {
        if (recipientUserId) {
            setActivePage('selected-chat');
        } else {
            setActivePage('chats');
        }
    }, [recipientUserId]);

    const openChat = (chat: ChatDataWithUserData) => {
        const newChatId = `${chat.participants.sort().join('_')}`
        console.log("Setting Chat ID:", newChatId);
        setChatId(newChatId);
        navigate(`/dashboard/chat?recipient-user-id=${chat.user.uid}`, {
            state: {newChatId, recipientUser: chat.user, chatUnlocked: chat.is_unlocked},
        });
    };

    return (
        <>
            {!selectedProfile && currentUser && (
                <DashboardPageContainer className="flex flex-col lg:block h-screen lg:h-auto">
                    <motion.div
                        animate={activePage === 'chats' ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="user-profile space-y-10 flex-1 lg:h-full"
                    >
                        <section className="space-y-[1.6rem] px-[1.6rem]">
                            <h1 className="text-[16px] font-medium">Likes and Matches</h1>
                            <div className="flex gap-x-4">

                                {peopleWhoLiked.length == 0 ? <div
                                    className="w-[11.2rem] h-[12rem] flex flex-col justify-center items-center rounded-[1.2rem] p-2 relative bg-[#F6F6F6]">
                                    <img className={`size-[6.4rem]`} src="/assets/icons/like-empty-state.png" alt=""/>
                                    <p className="text-[#8A8A8E] text-[1.4rem]">No Likes found!</p>
                                </div> :

                                <div className="w-[11.2rem] h-[12rem] rounded-[1.2rem] p-2 relative"
                                     style={{border: '2px solid #FF5C00'}}>
                                    <img src="/assets/images/matches/stephen.png"
                                         className="w-full h-full object-cover rounded-[1.2rem] blur-sm" alt=""/>
                                    <div
                                        className="absolute from-[#FF5C00] top-16 left-10 to-[#F0174B] rounded-full bg-gradient-to-b text-white font-medium text-[1.4rem] flex gap-x-1 p-[0.8rem]">
                                        <p>{peopleWhoLiked.length}</p> <img src="/assets/icons/likes.svg"/>
                                    </div>
                                    <div
                                        className="text-[1.2rem] text-white font-medium bg-gradient-to-b from-[#FF5C00] to-[#F0174B] absolute bottom-4 left-10 rounded-full w-fit p-2 px-4">
                                        Likes
                                    </div>
                                </div> }

                                {matches.length == 0 ? <div
                                        className="w-[11.2rem] h-[12rem] flex flex-col justify-center items-center rounded-[1.2rem] p-2 relative bg-[#F6F6F6]">
                                        <img src="/assets/icons/no-matches-yet.svg" alt=""/>
                                        <p className="text-[#8A8A8E] text-[1.4rem]">No match found!</p>
                                    </div> :
                                    <div className='matches__total-matches-preview-small'>
                                        <div className='matches__total-matches-preview-inner'>
                                            {/* @ts-ignore */}
                                            <img src={matches.length > 0 ? matches[0]?.matchedUserData?.photos[0] : ''}
                                                 alt={``}/>
                                            <div className='matches__matches-count'>
                                                <span>{matches.length}</span>
                                                <img src="/assets/icons/fire-white.svg" alt={``}/>
                                            </div>

                                            <div className='matches__matches-count z-[1000]'>
                                                <span>{matches.length}</span>
                                                <img src="/assets/icons/fire-white.svg" alt={``}/>
                                            </div>
                                        </div>
                                    </div> }
                            </div>
                        </section>
                        <section>
                            {allChats.length !== 0 &&
                                <h1 className="text-[16px] font-medium mb-4 px-[1.6rem]">Messages</h1>}
                            {!isLoadingChats ? (
                                allChats.length === 0 ? (
                                    <div
                                        className="text-[1.6rem] font-medium mb-4 px-[1.6rem] flex flex-col justify-center items-center h-full text-[#D3D3D3]">
                                        <p>No messages yet, go to the explore page to start chatting</p>.
                                        <button
                                            className="bg-[#F2243E] text-white py-3 px-6 rounded-lg active:scale-[0.95] transition ease-in-out duration-300 hover:scale-[1.02]"
                                            onClick={() => navigate('/dashboard/explore')}
                                        >
                                            Explore
                                        </button>
                                    </div>
                                ) : (
                                    allChats.map((chat, i) => (
                                        <ChatListItem
                                            key={`${chat.last_sender_id}_${currentUserId}_${i}`}
                                            userData={currentUser as User}
                                            onlineStatus={chat.user?.user_settings?.online_status && chat.user?.status?.online}
                                            contactName={chat.user.first_name || "Unknown"}
                                            profileImage={chat.user.photos && chat.user.photos[0]}
                                            chatUnlocked={chat.is_unlocked}
                                            openChat={() => openChat(chat)}
                                            chat={chat}
                                        />
                                    ))
                                )
                            ) : (
                                Array.from({ length: 7 }).map((_, i) => <ChatListItemLoading key={i} />)
                            )}
                        </section>
                    </motion.div>
                    {currentUser && (
                        <SelectedChat
                            activePage={activePage}
                            closePage={() => {
                                setActivePage('chats');
                                navigate('/dashboard/chat');
                            }}
                            updateChatId={setChatId}
                            currentUser={currentUser}
                        />
                    )}
                </DashboardPageContainer>
            )}
            {selectedProfile && (
                <ViewProfile
                    onBackClick={() => setSelectedProfile(null)}
                    userData={profiles.find(profile => selectedProfile === profile.uid)!}
                    onBlockChange={refreshProfiles}
                />
            )}
        </>
    );
};

export default ChatPage;