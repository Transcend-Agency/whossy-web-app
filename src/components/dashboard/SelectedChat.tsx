import {ChangeEvent, FC, useEffect, useRef, useState} from "react";
import {AnimatePresence, motion, motion as m} from "framer-motion";
import Skeleton from "react-loading-skeleton";
import EmojiPicker from "emoji-picker-react";
import {IoCheckmarkDone} from "react-icons/io5";
import {
    arrayRemove, arrayUnion,
    collection,
    doc,
    FieldValue,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc
} from "firebase/firestore";
import {db} from "@/firebase";
import {v4 as uuidv4} from "uuid";
import upload from "@/hooks/upload";
import { updateUserProfile} from "@/hooks/useUser.ts";
import {formatFirebaseTimestampToTime, formatServerTimeStamps} from "@/constants";
import {useChatIdStore} from "@/store/ChatStore";
import {Chat, Messages} from "@/types/chat";
import {User} from "@/types/user";
import toast from "react-hot-toast";
import {useLocation, useNavigate} from "react-router-dom";
import {useMatchStore} from "@/store/Matches.tsx";
import ReportModal from "@/components/dashboard/ReportModal.tsx";
import {useNavigationStore} from "@/store/NavigationStore.tsx";

interface SelectedChatProps {
    activePage: string
    closePage: () => void
    updateChatId: (newChatId: string) => void;
    currentUser: User;
}

export const checkIfUserBlocked = async (userId: string, targetUserId: string): Promise<boolean> => {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const data = userDoc.data() as User
            const blockedList: string[] = data.blockedIds || [];

            return blockedList.includes(targetUserId);
        }
    } catch (error) {
        console.error(`Error checking block status between ${userId} and ${targetUserId}:`, error);
    }
    return false;
};

const SelectedChat: FC<SelectedChatProps> = ({activePage,closePage,updateChatId,currentUser}) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [text, setText] = useState<string>('');
    const [chatModalOpen, setChatModalOpen] = useState<boolean>(false)
    const [openModal, setOpenModal] = useState<boolean>(false)
    const [recipientUser, setRecipientUser] = useState<User>();
    const [currentChat, setCurrentChat] = useState<Chat>();
    const [isBlocked, setIsBlocked] = useState<boolean>(false)
    const [isBlockLoading, setIsBlockLoading] = useState<boolean>(false)
    const [chatUnlocked, setChatUnlocked] = useState<boolean>();
    const [readReceipt, setReadReceipt] = useState<boolean>(false);
    const [readReceiptDisabledAt, setReadReceiptDisabledAt] = useState<Date | null>(null);
    const [openEmoji, setOpenEmoji] = useState(false);
    const [chats, setChats] = useState<Messages[]>([]);
    const [recipientDetails, setRecipientDetails] = useState<{
        name: string | null,
        profilePicture: string | null,
        status: {online: boolean, lastSeen: number} | null,
        user_settings: {online_status: boolean} | null }
    >({ name: null, profilePicture: null, status: null, user_settings: null });
    const [image, setImage] = useState<{ file: File | null, url: string | null }>({ file: null, url: null});

    const imageRef = useRef<HTMLInputElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const { chatId, setChatId } = useChatIdStore();
    const { fetchMatches } = useMatchStore()
    const navigate = useNavigate()

    const { setActivePage: setPage } = useNavigationStore()

    //getting recipient user's name and profile picture from query params
    const queryParams = new URLSearchParams(location.search);
    const recipientUserId = queryParams.get('recipient-user-id') as string;

    const location2 = useLocation();
    const state = location2.state as { chatId: string; recipientUser: User; chatUnlocked: boolean };
    const checkChatUnlocked = state?.chatUnlocked ?? false;

// Initialize chatId from state
    useEffect(() => {
        if (state?.chatId) {
            setChatId(state.chatId);
        }
        if(state?.recipientUser){
            setRecipientUser(state.recipientUser as User)
        }
    }, [state]);

    useEffect(() => { if (endRef.current) { endRef.current.scrollIntoView({ behavior: 'auto' }); } }, [chats])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {setOpenEmoji(false)}
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => { document.removeEventListener("mousedown", handleClickOutside) }
    }, []);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true)

        const getUserDetails = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, "users", recipientUserId as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && isMounted) {
                    const data = docSnap.data();
                    setRecipientDetails({
                        name: data?.first_name || null,
                        profilePicture: (data?.photos && Array.isArray(data.photos) && data.photos.length > 0) ? data.photos[0] : null,
                        status: { online: data?.status?.online, lastSeen: data?.status?.lastSeen },
                        user_settings: { online_status: data?.user_settings?.online_status },
                    });
                } else if (isMounted) {
                    console.log('No such document found');
                }
            } catch (error) {
                console.log("Error getting document:", error);
            }
        };

        if (recipientUserId) {
            updateChatDocument().catch(e => console.error(e))
            getUserDetails().then(
                () => handleReadReceipts().then(() => setIsLoading(false))
            )
        }

        return () => {
            isMounted = false;
        };
    }, [recipientUserId]);

    useEffect(() => {
        if (!chatId || !currentUser.uid || activePage !== "selected-chat") return;
        const messagesRef = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp", "asc"));
        const chatDocRef = doc(db, "chats", chatId as string);

        // Listen to changes in the chat messages
        const unSub = onSnapshot(messagesRef, async (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Messages[];

            setChats(messages);

            // Fetch the chat document (used to get lastSenderId)
            const chatDocSnap = await getDoc(chatDocRef);
            if (chatDocSnap.exists()) {
                const chatData: Chat = chatDocSnap.data() as Chat;
                const last_sender_id = chatData.last_sender_id;
                setChatUnlocked(chatData.is_unlocked)

                // Check if the current user is not the last sender and the chat is open
                if (last_sender_id !== currentUser.uid && chatData.status !== "seen" && activePage === "selected-chat") {
                    // Update the seen status in 'chats' collection
                    await updateDoc(chatDocRef, 'status', 'seen')
                        .then(() => console.log(`${last_sender_id}: ${currentUser.uid}`))
                        .catch((err) => console.error(`Error updating chat ${chatId}:`, err));
                }
            }

            // Check each message to see if it should be marked as 'seen'
            for (const doc1 of snapshot.docs) {
                const messageData = doc1.data() as Messages;
                const messageSenderId = messageData.sender_id;

                // Only update the message if the sender is not the current user and status is not 'seen'
                if (messageSenderId !== currentUser.uid
                    && messageData.status !== "seen"
                    && activePage === "selected-chat"
                    && !messageData.sender_id_blocked ) {
                    try {
                        // Update the status field of the message to "seen"
                        await updateDoc(doc1.ref, 'status', "seen" );
                        console.log(`Message ${doc1.id} marked as seen`);
                    } catch (err) {
                        console.error(`Error updating message ${doc1.id}:`, err);
                    }
                }
            }
        }, (err) => console.log(err));

        // Cleanup function to unsubscribe from the snapshot listener
        return () => {
            unSub();
            // Reset only if leaving the dashboard
            if (!window.location.pathname.includes("/dashboard/chat")) {
                setChats([]);
                debounceUpdateChatId("nil");
            }
        };


    }, [activePage, chatId]);

    const updateUserChat = async (
        uid: string,
        success: () => void,
        updatedFields?: Partial<Chat>
    ) => {
        const chatRef = doc(db, "chats", uid as string);
        await updateDoc(chatRef, updatedFields as Chat).then(() => {
            success();
        });
    };

    const updateChatDocument = async () => {
        const currentUserBlockedRecipient = await checkIfUserBlocked(currentUser.uid as string, recipientUserId as string);
        const recipientBlockedCurrentUser = await checkIfUserBlocked(state.recipientUser.uid as string, currentUser.uid as string);
        const userBlockedStatus: boolean[] = [currentUserBlockedRecipient, recipientBlockedCurrentUser];
        const bothPremiumUsers = state.recipientUser.is_premium && currentUser.is_premium

        if(!chatId) return
        try {
            const chatId = [currentUser.uid, state.recipientUser.uid].sort().join('_')
            const updateData: Partial<Chat> = { user_blocked: userBlockedStatus, };
            if (bothPremiumUsers) { updateData.is_unlocked = true }

            updateUserChat(chatId, () => console.log("Chat document updated!"), updateData).catch(e => console.error(e))
            const chatDocRef = doc(db, "chats", chatId);
            if (chatDocRef) {
                const chatDocSnap = await getDoc(chatDocRef);
                if (chatDocSnap.exists()) {
                    const chatData = chatDocSnap.data() as Chat;
                    setCurrentChat(chatData);
                    setIsBlocked(currentUserBlockedRecipient)
                } else {
                    console.warn("Chat document does not exist.");
                }
            }

            updateChatId(chatId);
        } catch (e) {
            console.log("Still updating chat", e);
            // console.error("Error updating or fetching chat:", error);
        }
    };

    const debounceUpdateChatId = (id: string) => {
        setTimeout(() => {
            updateChatId(id);
        }, 100); // Adjust the delay as needed
    };


    const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setImage({
                file: file,
                url: URL.createObjectURL(file),
            });
        }
    };

    const unlockChat = async (chatId: string): Promise<void> => {
        const chatRef = doc(db, "chats", chatId);

        const expirationTime = Timestamp.fromDate(
            new Date(new Date().getTime() + (48 * 60 * 60 * 1000) )
        );

        // @ts-expect-error currentUser is probably undefined.
        if(currentUser.credit_balance < 1){
            setPage('add-credits')
            navigate("/dashboard/user-profile")
        } else {
            const newCredit: number = currentUser?.credit_balance as number - 1;
            console.log(newCredit)
            try {
                await updateDoc(chatRef, {
                    is_unlocked: true,
                    unlock_time: serverTimestamp(),
                    expiration_time: expirationTime,
                });
                state.chatUnlocked = true
                setChatUnlocked(true)
                console.log("Chat unlocked successfully!");
                toast.success("Chat unlocked for 48Hours", { duration: 3} )
            } catch (error) {
                console.error("Error unlocking chat:", error);
                toast.error("An error occurred.")
            }

            try {
                console.log("Updating Chat Credit")
                updateUserProfile("users" , currentUser.uid as string,
                    () => console.log("Chat document updated!"),
                    { credit_balance : newCredit }).catch(e => console.error(e))
            }
            catch (err) { console.error("Error updating credit balance")}
        }
    };

    const isChatUnlocked = async (chatId: string): Promise<boolean> => {
        try {
            const chatRef = doc(db, "chats", chatId);
            const chatSnapshot = await getDoc(chatRef);
            if (!chatSnapshot.exists()) {
                console.error("Chat document does not exist.");
                return false;
            }

            const chatData = chatSnapshot.data() as Chat;
            const isUnlocked = chatData.is_unlocked;
            const expirationTime = chatData.expiration_time as Timestamp;

            console.log(isUnlocked)

            if (!isUnlocked || !expirationTime) return false;

            const currentTime = Date.now();
            const expirationTimeMs = expirationTime.seconds * 1000;

            return currentTime < expirationTimeMs;
        } catch (error) {
            console.error("Error fetching chat data:", error);
            return false;
        }
    };

    //sending text message to the recipient
    const handleSendMessage = async () => {
        let imgUrl: string | null = null;
        if(!chatId) return
        if(!await isChatUnlocked(chatId) && !currentUser.is_premium){
            toast.error("Chat Unlock Duration Expired")
            setChatUnlocked(false)
            state.chatUnlocked = false
            closePage()
            return;
        }

        // Generate the messageId and timestamp upfront
        const messageId = uuidv4();
        const temporaryTimestamp = {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
        };

        const recipientBlockedCurrentUser = await checkIfUserBlocked(state.recipientUser.uid as string, currentUser.uid as string);
        // Create optimistic message object with a placeholder for image if it's being uploaded
        const optimisticMessage: Messages = {
            id: messageId,
            sender_id: currentUser?.uid as string,
            sender_id_blocked: recipientBlockedCurrentUser,
            message: text !== '' ? text : null,
            photo: image.file ? 'loading_image_placeholder' : null, // Placeholder for image
            timestamp: temporaryTimestamp,
            status: 'sent',
        };

        // Optimistically add the message to the chat array
        setChats(prevChats => [...prevChats, optimisticMessage]);

        // Clear input fields
        setText('');
        setImage({ file: null, url: null });

        try {
            if (image.file) {
                // Upload the image and get the URL
                imgUrl = await upload(image.file);

                // Update the chat array with the real image URL after the upload is done
                setChats(prevChats => prevChats.map(chat =>
                    chat.id === messageId ? { ...chat, photo: imgUrl } : chat
                ));
            }

            // Send the message to Firebase
            const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
            await setDoc(messageRef, {
                id: messageId,
                sender_id: currentUser.uid,
                sender_id_blocked: recipientBlockedCurrentUser,
                message: text !== '' ? text : null,
                photo: imgUrl ?? null,
                timestamp: serverTimestamp(),
                status: "sent"
            });

            // {
                await updateDoc(doc(db, "chats", chatId), {
                    last_message: text || 'Image',
                    last_message_id: messageId,
                    last_sender_id: currentUser.uid,
                    status: "sent",
                    last_message_timestamp: serverTimestamp(),
                });
            // }

        } catch (err) {
            console.error('Error sending message:', err);
            // Remove the optimistic message if there was an error
            setChats(prevChats => prevChats.filter(chat => chat.id !== optimisticMessage.id));
        }
    };

    const determineReadReceipt = async () => {
        if (!state.recipientUser || !currentUser) {
            console.log("Could not fetch both user details.");
            return null;
        }

        if (!state.chatUnlocked) {
            return false;
        }

        const userReadReceipts = currentUser.user_settings?.read_receipts || false;
        const recipientReadReceipts = state.recipientUser.user_settings?.read_receipts || false;

        if (!userReadReceipts || !recipientReadReceipts) {
            setReadReceiptDisabledAt(new Date());
        }

        return userReadReceipts && recipientReadReceipts;
    };

    const handleReadReceipts = async () => {
        try {
            const readReceiptsEnabled = await determineReadReceipt() as boolean;
            setReadReceipt(readReceiptsEnabled);

            if (readReceiptsEnabled) {
                setReadReceiptDisabledAt(null);
            }
        } catch (error) {
            console.error("Error handling read receipts:", error);
        }
    };

    const handleBlock = async (recipientId: string, isBlocked: boolean) => {
        setIsBlockLoading(true)
        if (!recipientId)
            toast.error("Unable to block user")
        else {
            try {
                const userRef = doc(db, "users", currentUser?.uid as string);

                if (isBlocked) {
                    await updateDoc(userRef, {
                        blockedIds: arrayRemove(recipientId)
                    });
                } else {
                    await updateDoc(userRef, {
                        blockedIds: arrayUnion(recipientId)
                    });
                }

                toast.success(`${recipientDetails.name} has been ${isBlocked ? "unblocked" : "blocked"} successfully.`);
                setIsBlocked(!isBlocked);
                setIsBlockLoading(false)
                updateChatDocument().then(
                    () => { fetchMatches(currentUser?.uid as string);}
                ).catch(e => console.error(e))
            } catch (error) {
                console.error("Error blocking/unblocking user:", error);
                toast.error("Could not block/unblock the user. Please try again.");
                setIsBlockLoading(false)
            }
        }
    };

    if (chatId === "nil") {
        return <p>Loading chat...</p>;
    }

    return (
        <AnimatePresence>
            <ReportModal key={'report-modal'} userData={recipientUser as User} show={openModal} onCloseModal={() => setOpenModal(false)} />
            {activePage === 'selected-chat' &&
                <>
                    <m.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ duration: 0.25 }} className='relative z-10 bg-white flex flex-col min-h-full'>
                      <>
                        <header className=" text-[1.8rem] py-[1.6rem] px-[2.4rem] flex justify-between items-center" style={{ borderBottom: '1px solid #F6F6F6' }}>
                            <button className="settings-page__title__left gap-x-1" onClick={() => {
                                closePage()
                                setImage({ file: null, url: null }); }
                            }>
                                <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``}/>
                                {!isLoading ? recipientDetails.profilePicture ?
                                        <img className='size-[4.8rem] mr-2 object-cover rounded-full' src={recipientDetails.profilePicture} alt="profile picture"/> :
                                        <div className="rounded-full size-[4.8rem] bg-[#D3D3D3] flex justify-center items-center font-semibold mr-2">
                                            {recipientDetails.name?.charAt(0)}
                                        </div> : <Skeleton width="4.8rem" height="4.8rem" circle/> }
                                <div className="space-y-1">
                                    {recipientDetails.name ? ( <p className="font-bold text-left">{recipientDetails.name}</p> ) : ( <Skeleton width="8rem" height="1.6rem"/>)}
                                    {recipientUser?.user_settings?.online_status ? (
                                        recipientUser.status?.online ? (
                                            <p className="text-[#8A8A8E] text-left font-normal font-sans italic text-[1.5rem]">online</p>
                                        ) : (
                                            <p className="text-[#8A8A8E] font-normal italic text-[1.5rem]">
                                                {recipientUser.status?.lastSeen
                                                    ? `last seen ${formatServerTimeStamps(recipientUser.status?.lastSeen as number)}`
                                                    : !isLoading
                                                        ? "last seen recently"
                                                        : <Skeleton width="10rem" height="1.2rem"/>}
                                            </p>
                                        )
                                    ) : (
                                        <p className="text-[#8A8A8E] font-normal italic text-[1.5rem]">
                                            {!isLoading ? "last seen recently" :
                                                <Skeleton width="10rem" height="1.2rem"/>}
                                        </p>
                                    )}
                                </div>

                            </button>
                            <button className="cursor-pointer" onClick={() => setChatModalOpen(!chatModalOpen)}>
                                <img src="/assets/icons/three-dots.svg" alt=""/>
                                <div className={`absolute ${!chatModalOpen ? 'hidden' : "block"} z-[100] whitespace-nowrap bg-[#F4F4F4] w-[130px] text-center p-6 rounded-md leading-6 right-8 top-[60px] grid items-center gap-4`}>
                                    <button onClick={(e) => {e.preventDefault(); handleBlock(recipientUser?.uid as string, isBlocked).catch(e => console.error(e))} } className={`border-b-[0.1px] border-opacity-30 border-black border-solid pb-4`}>{isBlocked ? 'Unblock' : 'Block'} User</button>
                                    <button onClick={(e) => {e.preventDefault(); setOpenModal(true) }} className={``}>Report User</button>
                                </div>
                            </button>
                        </header>
                          <section className="text-[1.6rem] text-[#121212] flex-1 px-8 flex flex-col overflow-y-scroll pb-20 no-scrollbar">
                              <section className="messages flex flex-col gap-y-6 h-[calc(100vh-32.4rem)] overflow-y-scroll no-scrollbar relative">
                                  <div className={`max-w-[70%] flex`} key={'no-chat-yet'}>
                                      {!isLoading && !checkChatUnlocked && currentUser.is_premium != true && chats.length === 0 && (
                                          <div className="overlay backdrop-blur-sm absolute inset-0 rounded-md bg-black/25 flex items-center pt-[24px] justify-center z-50">
                                              <div className={`grid p-4 items-center text-[2rem] bg-[#ff1f1] text-white rounded-md font-bold mx-[50px] w-[300px] text-center gap-8`}>
                                                  <img className={`size-[50px] mx-auto`} src="/assets/icons/no-message.svg" alt={``} />
                                                  <p>Chat has not been unlocked 🔒</p>
                                                  <p>Unlock this chat for both of you to connect 😍</p>
                                                  <p>1 Credit is required to unlock chat</p>
                                                  <p className={`whitespace-nowrap flex gap-x-2 items-start`}>
                                                      <img className={`size-[24px]`}
                                                           src={`/assets/images/dashboard/coin.png`} alt={``}/>
                                                      Credit Balance: {`${currentUser?.credit_balance || 0}`} credits
                                                  </p>
                                                  <div className={` flex-col flex justify-center gap-4 items-center`}>
                                                      <button onClick={(e) => {
                                                          e.preventDefault();
                                                          if(chatId) {
                                                              unlockChat(chatId)
                                                                  .then(() => console.log("Chat Unlocked")).catch(e => console.error("Error Unlocking chat", e))
                                                          }
                                                      }} className={`border p-3 bg-gradient-to-br from-red to-orange-400 hover:bg-gradient-to-br hover:from-red/80 hover:to-orange-600 active:scale-95 rounded-md px-2 w-[140px]`}>
                                                          { /* @ts-expect-error currentUser is probably undefined.*/ }
                                                          {currentUser?.credit_balance !== null && currentUser?.credit_balance < 1
                                                              ? 'Buy Credits'
                                                              : 'Use Credits'}
                                                      </button>
                                                      <p className={`font-bold text-[18px] text-white`}>OR</p>
                                                      <button onClick={() => {
                                                          setPage('subscription-plans')
                                                          navigate("/dashboard/user-profile")}
                                                      } className={`border p-4 bg-gradient-to-r from-orange-400 to-red hover:from-orange-600 hover:to-red/80 active:scale-95 rounded-md px-3 w-fit`} >Subscribe to Premium</button>
                                                  </div>
                                              </div>
                                          </div>
                                      )}
                                  </div>
                                {chats && Array.isArray(chats) && chats?.filter((message: Messages) => {
                                    return !(message.sender_id_blocked && message.sender_id !== currentUser.uid)
                                }).map((message: Messages, i: number) =>
                                    <div className={`max-w-[70%] flex ${message.sender_id === currentUser?.uid ? " flex-col self-end our_message" : ' gap-x-2 items-start flex-col their_message'}`} key={i}>
                                        {!isLoading && !checkChatUnlocked && currentUser.is_premium != true && (
                                            <div className="overlay backdrop-blur-sm absolute inset-0 rounded-md bg-black/25 flex items-center pt-[24px] justify-center z-50">
                                                <div className={`grid p-4 items-center text-[2rem] bg-[#ff1f1] text-white rounded-md font-bold mx-[50px] w-[300px] text-center gap-8`}>
                                                    <img className={`size-[50px] mx-auto`} src="/assets/icons/no-message.svg" alt={``} />
                                                    <p>Chat has not been unlocked 🔒</p>
                                                    <p>Unlock this chat for both of you to connect 😍</p>
                                                    <p>1 Credit is required to unlock chat</p>
                                                    <p className={`whitespace-nowrap`}>Credit Balance: {`${currentUser?.credit_balance || 0}`} credits</p>
                                                    <div className={`flex justify-center gap-4 items-center`}>
                                                        <button onClick={(e) => {
                                                            e.preventDefault();
                                                            if (chatId) {
                                                                unlockChat(chatId)
                                                                    .then(() => console.log("Chat Unlocked")).catch(e => console.error("Error Unlocking chat", e))
                                                            }
                                                        }}
                                                                className={`border p-3 bg-green-700 hover:bg-green-800 active:scale-95 rounded-md px-2 w-[140px]`}>
                                                            {/* @ts-expect-error currentUser is probably undefined.*/}
                                                            {currentUser?.credit_balance !== null && currentUser?.credit_balance < 1
                                                                ? 'Buy Credits'
                                                                : 'Use Credits'}
                                                        </button>
                                                        <p className={`font-bold text-[18px] text-white`}>OR</p>
                                                        <button onClick={() => {
                                                            setPage('subscription-plans')
                                                            navigate("/dashboard/user-profile")
                                                        }
                                                        }
                                                                className={`border p-4 bg-gradient-to-r from-orange-400 to-red hover:from-orange-600 hover:to-red/80 active:scale-95 rounded-md px-3 w-fit`}>Subscribe
                                                                                                                                                                                                             to
                                                                                                                                                                                                             Premium
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            {message.photo && message.photo !== 'loading_image_placeholder' ?
                                                <img className='mr-2 max-h-[30rem] w-full object-contain ' src={message.photo as string} alt="profile picture" /> : message.photo === 'loading_image_placeholder' && <Skeleton width="30rem" height="30rem" /> }

                                            {message.message && <p className={`${message.sender_id === currentUser?.uid ? 'bg-[#E5F2FF]  self-end' : 'bg-[#f6f6f6]'} py-[1.6rem] px-[1.2rem] mt-4 w-fit`} style={{ borderTopLeftRadius: '1.2rem', borderTopRightRadius: '1.2rem', borderBottomLeftRadius: message.sender_id === currentUser?.uid ? '1.2rem' : '0.4rem', borderBottomRightRadius: message.sender_id === currentUser?.uid ? '0.4rem' : '1.2rem' }}>{message.message}</p>}
                                        </div>
                                        <p className="flex justify-end mt-2 text-[#cfcfcf]">
                                            {message.sender_id === currentUser?.uid && (
                                                <IoCheckmarkDone
                                                    color={!readReceipt
                                                        ? "#cfcfcf" : (readReceiptDisabledAt && !(message.timestamp instanceof FieldValue) &&
                                                        new Date(message.timestamp.seconds * 1000) < readReceiptDisabledAt)
                                                        ? "#cfcfcf" : message.status === "seen" ? "#2747d8" : "#cfcfcf"
                                                    }
                                                />)}
                                            <span>
                                              {message.timestamp &&
                                                formatFirebaseTimestampToTime(message.timestamp as { seconds: number, nanoseconds: number })}
                                            </span>
                                        </p>
                                    </div>)
                                }
                                <div ref={endRef} />
                            </section>
                        </section>
                        <AnimatePresence>
                            {openEmoji && <m.div initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 50 }} transition={{ duration: 0.3, ease: "easeInOut" }} ref={dropdownRef} className="absolute bottom-32 right-8 "><EmojiPicker onEmojiClick={(e) => { if (!(chatUnlocked || currentUser?.is_premium)) return; setText((prev) => prev + e.emoji) } } /> </m.div>}</AnimatePresence>
                        {!currentChat?.user_blocked[0] || isLoading ? <footer className=" flex justify-between text-[1.6rem] bg-white items-center gap-x-4 mx-6 sticky bottom-10">
                                <div className="flex-1 flex gap-x-4">
                                    {/* Image Upload Section */}
                                    <img
                                        className="size-[4.4rem] cursor-pointer"
                                        src="/assets/icons/add-image.svg"
                                        alt=""
                                        onClick={() => imageRef.current?.click()}
                                    />
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={imageRef}
                                        onChange={handleImage}
                                        accept="image/*"
                                    />

                                    {/* Text Input Section */}
                                    <div className="flex bg-[#F6F6F6] w-full rounded-l-full px-5 items-center rounded-r-full overflow-hidden">
                                        {image.url && (
                                            <img
                                                src={image.url}
                                                alt="Selected preview"
                                                className="absolute left-[5rem] -top-[110px] transform size-[100px] object-cover rounded-md"
                                            />
                                        )}

                                        <input
                                            disabled={!(chatUnlocked || currentUser?.is_premium)}
                                            type="text"
                                            className={`bg-inherit outline-none w-full`}
                                            placeholder="Say something nice"
                                            value={text} // Keep only the `text` value
                                            onChange={(e) => setText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (text || image.url)) {
                                                    handleSendMessage()
                                                        .catch((e) => console.error("Unable to send message", e));
                                                }
                                            }}
                                        />
                                        <img
                                            className="size-[1.6rem] ml-4 cursor-pointer"
                                            src="/assets/icons/emoji.svg"
                                            alt="Emoji selector"
                                            onClick={() => setOpenEmoji(true)}
                                        />
                                    </div>
                                </div>

                                {/* Send Button Section */}
                                <div className="space-x-4">
                                    <button
                                        className={`bg-black text-white py-4 font-semibold px-4 rounded-full ${
                                            !text && !image.url ? 'cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                        onClick={handleSendMessage}
                                        disabled={!text && !image.url}
                                    >
                                        Send
                                    </button>
                                </div>
                            </footer> :
                            <footer
                                className={`grid text-[1.6rem] bg-white items-center gap-x-4 mx-6 sticky bottom-5 border border-black`}>
                                <div
                                    className={`text-center border-b-[0.1px] border-opacity-30 border-black border-solid pb-[1rem]`}>
                                    <p>You can't message <span className={`font-medium`}>{recipientDetails.name}</span>.
                                    </p>
                                </div>
                                {isBlockLoading ?
                                    <div className={`action-button grid place-items-center pt-2 items-center w-full`}>
                                        <motion.img key="loading-image" className='button__loader'
                                                    src='/assets/icons/loader-black.gif'/>
                                    </div> :
                                    <button className={`text-red border-[1px] border-black pt-2 font-bold text-2xl`}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleBlock(recipientUser?.uid as string, isBlocked).catch(e => console.error(e))
                                            }}>Unblock Account
                                    </button>
                                }
                            </footer>}
                      </>
                    </m.div>
                </>}
        </AnimatePresence>
    )
}

export default SelectedChat