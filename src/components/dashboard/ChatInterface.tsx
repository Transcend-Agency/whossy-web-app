import { useEffect, useState, FC } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/store/UserId';
import { useNavigate } from 'react-router-dom';
import {Chat, Messages} from '@/types/chat';
import { User } from '@/types/user';
import { useChatIdStore } from '@/store/ChatStore';
import { getUserProfile } from '@/hooks/useUser';
import {ChatListItem} from "@/components/dashboard/ChatListItem.tsx";
import {createOrFetchChat, getLastValidMessage} from "@/utils/chatService.ts";

interface ChatDataWithUserData extends Chat {
    user: User;
}

const ChatInterface: FC = () => {
    const { auth } = useAuthStore();
    const [chats, setChats] = useState<ChatDataWithUserData[]>([]);
    const [showChats, setShowChats] = useState<boolean>(false);
    const [unreadChats, setUnreadChats] = useState<number | null>(null);
    const navigate = useNavigate();
    const currentUserId = auth?.uid as string;
    const [userData, setUserData] = useState<User | null>(null);
    const [_recipientData, setRecipientData] = useState<User | null>(null);
    const { setChatId } = useChatIdStore();
    const [isLoadingChats, setIsLoadingChats] = useState(false);

    const fetchUserChats = async (id: string) => {
        const userChatsDocRef = doc(db, 'chats', id);
        const userChatsDocSnap = await getDoc(userChatsDocRef);
        return userChatsDocSnap.exists() ? userChatsDocSnap.data() as Chat : null;
    };

    const fetchUserData = async (userId: string) => {
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

    const fetchLoggedUserData = async () => {
        try {
            const data = await getUserProfile('users', auth?.uid as string) as User;
            setUserData(data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const getUnreadChats = async (sortedChats: Chat[], currentUserUid: string) => {
        const unreadChatsCount = await Promise.all(
            sortedChats.map(async (chat) => {
                // Get the last valid message for each chat
                const lastMessage = await getLastValidMessage(chat, currentUserUid) as Messages;

                // If there is no valid message or the last message's sender is blocked, don't count the chat
                if (!lastMessage || lastMessage.sender_id_blocked) {
                    return false;
                }

                // Check if the chat is sent, unlocked (or not if user is not premium), and not the user's own chat
                return chat.status === "sent" && chat.last_sender_id !== auth?.uid && !chat.is_unlocked;
            })
        );

        // Filter only the valid unread chats
        const unreadChats = unreadChatsCount.filter((isUnread) => isUnread);
        setUnreadChats(unreadChats.length);  // Set the unread chats count
    };

    useEffect(() => {
        fetchLoggedUserData().catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        let isMounted = true;
        setIsLoadingChats(true);

        const unSub = onSnapshot(collection(db, 'chats'), async (snapshot) => {
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
                        const recipientData = chat?.participants?.filter(
                            (participant: string) => participant !== currentUserId
                        );

                        if (!recipientData || recipientData.length === 0) {
                            return null;
                        }

                        const recipientUserData = await fetchUserData(recipientData[0]);
                        if (!recipientUserData || recipientUserData.is_banned) {
                            console.warn("Skipping chat due to missing user data:", chat);
                            return null;
                        }else {
                            setRecipientData(recipientUserData)
                        }
                        if (!recipientUserData) {
                            console.error("Failed to fetch user data for recipient:", recipientData[0]);
                            return null; // Skip this chat if no user data is found
                        }

                        return { ...chat, user: recipientUserData };
                    })
            );
            const filteredChats = chatDataWithUserData.filter(chat => chat !== null) as ChatDataWithUserData[];

            const sortedChats = filteredChats.filter(chat => chat.last_sender_id !== null || chat.last_message !== null).sort((a, b) => {
                // @ts-ignore
                const aTimestamp = a.last_message_timestamp?.seconds || 0;
                // @ts-ignore
                const bTimestamp = b.last_message_timestamp?.seconds || 0;
                return bTimestamp - aTimestamp;
            });

            if (isMounted) {

                setChats(sortedChats);
                getUnreadChats(chats as Chat[], currentUserId as string)
            }
            setIsLoadingChats(false);
        });

        return () => {
            isMounted = false;
            unSub();
        };
    }, [currentUserId]);

    return (
        <div className="dashboard-layout__chat-interface hidden lg:block">
            <motion.div
                className="dashboard-layout__chat-interface__drawer z-50"
                data-cy="chat-interface-modal"
                transition={{ duration: 0.3 }}
            >
                <div className="flex justify-between px-[1.6rem] pb-[2.2rem] cursor-pointer" onClick={() => setShowChats(!showChats)}>
                    <div className="dashboard-layout__chat-interface__drawer__left">
                        <img src="/assets/images/dashboard/chat-heart.svg" alt={``} />
                        <span className=""> Chat </span>
                        {unreadChats !== 0 && unreadChats && (
                            <div className="dashboard-layout__chat-interface__drawer__left__unread-count">
                                {unreadChats}
                            </div>
                        )}
                    </div>
                    <button
                        className={`dashboard-layout__chat-interface__drawer__open-button cursor-pointer transform transition-transform duration-300 ${
                            showChats ? 'rotate-180' : ''
                        }`}>
                        <img
                            src="/assets/images/dashboard/open-drawer.svg"
                            alt="open drawer"
                        />
                    </button>
                </div>
                <AnimatePresence>
                    {!isLoadingChats && showChats && (
                        <motion.div
                            className="bg-white "
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {chats?.length > 0 ? (
                                chats.slice(0, 4).map((chat, i) => (
                                    <ChatListItem
                                        key={`${chat.last_sender_id}_${currentUserId}_${i}`}
                                        contactName={chat.user.first_name as string}
                                        userData={userData as User}
                                        onlineStatus={chat.user?.user_settings?.online_status && chat.user?.status?.online}
                                        profileImage={chat.user.photos && chat.user.photos[0]}
                                        chatUnlocked={chat.is_unlocked}
                                        chat={chat}
                                        openChat={async () => {
                                            if(chat.user.uid){
                                                const chatId = chat.participants.sort().join('_')
                                                setChatId(chatId)
                                                await createOrFetchChat(auth?.uid as string, chat.user.uid as string, setChatId).then(
                                                    () => {
                                                        if (chatId != "nil") {
                                                            navigate(`/dashboard/chat?recipient-user-id=${chat.user.uid as string}`, {
                                                                state: {chatId, recipientUser: chat.user, chatUnlocked: chat.is_unlocked},
                                                            });
                                                            setChatId(chatId)
                                                        }
                                                    }
                                                )
                                            }
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="w-full h-[10rem] flex flex-col  justify-center items-center">
                                    <p className="text-[1.4rem]">
                                        Oops! Looks like you have no chats💔
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ChatInterface;