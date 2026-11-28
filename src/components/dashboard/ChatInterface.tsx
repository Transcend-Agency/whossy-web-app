import { useEffect, useRef, useState, FC } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/store/UserId';
import { useNavigate } from 'react-router-dom';
import {Chat, Messages} from '@/types/chat';
import { User } from '@/types/user';
import { useChatIdStore } from '@/store/ChatStore';
import { getUserProfile } from '@/hooks/useUser';
import {ChatListItem} from "@/components/dashboard/ChatListItem.tsx";
import {createOrFetchChat, getLastValidMessage} from "@/utils/chatService.ts";
import {isChatWindowActive} from "@/utils/chatCreditState";
import {isChatUnread} from "@/utils/chatUnread";
import {needsDeliveryAck} from "@/utils/chatDelivery";
import {hidesOnlineStatus, isRecentlyOnline} from "@/utils/presence";
import { pressable } from '@/utils/pressable';

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
    const [, setRecipientData] = useState<User | null>(null);
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

    const getUnreadChats = async (sortedChats: ChatDataWithUserData[], currentUserUid: string) => {
        const unread = await Promise.all(
            sortedChats.map(async (chat) => {
                // Looked up exactly as each ChatListItem does, so the count
                // matches the rows marked "Unread".
                const lastMessage = await getLastValidMessage(chat, chat.user?.uid as string) as Messages;
                return isChatUnread(chat, lastMessage, currentUserUid);
            })
        );
        setUnreadChats(unread.filter(Boolean).length);
    };

    useEffect(() => {
        fetchLoggedUserData().catch((err) => console.error(err));
    // Fetch the logged-in user's profile once on mount; fetchLoggedUserData is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The latest message, per chat, this device has already acknowledged, so
    // each new message is acknowledged once.
    const deliveryAckedFor = useRef(new Map<string, string>());

    useEffect(() => {
        let isMounted = true;
        setIsLoadingChats(true);

        // Scoped to this user's own chats (participants array-contains) —
        // an unfiltered listen on the whole collection can't be secured by
        // Firestore rules (A6) since a rule can't field-mask a broad listen.
        const unSub = onSnapshot(query(collection(db, 'chats'), where('participants', 'array-contains', currentUserId)), async (snapshot) => {
            if (!isMounted) return;

            // Tell senders their messages reached this device (two grey
            // ticks). This drawer is mounted on every dashboard page, so it
            // covers the whole time the web app is open.
            for (const chatDoc of snapshot.docs) {
                const chat = chatDoc.data() as Chat;
                if (!needsDeliveryAck(chat, currentUserId)) continue;
                if (deliveryAckedFor.current.get(chatDoc.id) === chat.last_message_id) continue;
                deliveryAckedFor.current.set(chatDoc.id, chat.last_message_id);
                updateDoc(chatDoc.ref, { [`delivered_at.${currentUserId}`]: serverTimestamp() })
                    .catch((err) => console.error(`Error marking chat ${chatDoc.id} delivered:`, err));
            }

            const chatIds: string[] = snapshot.docs.map((doc) => doc.id);

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
                // @ts-expect-error legacy type mismatch
                const aTimestamp = a.last_message_timestamp?.seconds || 0;
                // @ts-expect-error legacy type mismatch
                const bTimestamp = b.last_message_timestamp?.seconds || 0;
                return bTimestamp - aTimestamp;
            });

            if (isMounted) {

                setChats(sortedChats);
                // Count from the list just built: `chats` here is the state
                // captured when this listener subscribed, usually still [].
                getUnreadChats(sortedChats, currentUserId as string)
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
                <div className="flex justify-between px-[1.6rem] pb-[2.2rem] cursor-pointer" {...pressable(() => setShowChats(!showChats))}>
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
                                        onlineStatus={!hidesOnlineStatus(chat.user) && isRecentlyOnline(chat.user?.status)}
                                        profileImage={chat.user.photos && chat.user.photos[0]}
                                        chatUnlocked={isChatWindowActive(chat)}
                                        chat={chat}
                                        openChat={async () => {
                                            if(chat.user.uid){
                                                const chatId = chat.participants.sort().join('_')
                                                setChatId(chatId)
                                                await createOrFetchChat(auth?.uid as string, chat.user.uid as string, setChatId).then(
                                                    () => {
                                                        if (chatId != "nil") {
                                                            navigate(`/dashboard/chat?recipient-user-id=${chat.user.uid as string}`, {
                                                                state: {chatId, recipientUser: chat.user, chatUnlocked: isChatWindowActive(chat)},
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