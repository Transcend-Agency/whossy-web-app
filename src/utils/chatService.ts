import {collection, doc, getDoc, getDocs, orderBy, query, setDoc} from "firebase/firestore";
import { db } from "@/firebase";
import {checkIfUserBlocked} from "@/components/dashboard/SelectedChat.tsx";
import {Chat, Messages} from "@/types/chat.ts";
import {User} from "@/types/user.ts";
import {isChatWindowActive} from "@/utils/chatCreditState";
import {NavigateFunction} from "react-router-dom";

export const createOrFetchChat = async ( currentUserId: string,  recipientUserId: string, updateChatId: (id: string) => void): Promise<void> => {
	const newChatId = [currentUserId, recipientUserId].sort().join('_');
	const chatDocRef = doc(db, "chats", newChatId);

	const chatDocSnap = await getDoc(chatDocRef);

	if (!chatDocSnap.exists()) {
		const currentUserBlockedRecipient = await checkIfUserBlocked(currentUserId, recipientUserId);
		const recipientBlockedCurrentUser = await checkIfUserBlocked(recipientUserId, currentUserId);
		const userBlockedStatus = [currentUserBlockedRecipient, recipientBlockedCurrentUser];

		// Only the empty shell. Whether the chat is unlocked, and until when,
		// is decided by the initiateChat Cloud Function; the rules reject a
		// client that tries to set any of it.
		await setDoc(chatDocRef, {
			last_message: null,
			last_message_id: null,
			last_sender_id: null,
			user_blocked: userBlockedStatus,
			participants: [currentUserId, recipientUserId].sort(),
			status: 'inactive',
			last_message_timestamp: null,
			is_unlocked: false,
		});
	}

	updateChatId(newChatId);
	//
	// if (newChatId != "nil" || !chat || !chat.participants || chat.participants.length < 2) {
	// 	const bothPremiumUsers = userData.is_premium && user?.is_premium
	// 	navigate(`/dashboard/chat?recipient-user-id=${userData.uid}`, {
	// 		state: {chatId, recipientUser: userData, chatUnlocked: bothPremiumUsers ? true : chat.is_unlocked },
	// 	});
	// 	setChatId(chatId)
	// }
};

/**
 * Opens the chat screen with `recipient`, creating the empty chat shell if
 * needed. Opening is never gated on premium or credits: the chat screen
 * itself blocks sending until the user has either (or the other side
 * started the chat), so a user with neither can still read and be prompted.
 * The screen reads chatId/recipientUser from router state, so every entry
 * point has to go through here rather than navigate to the URL alone.
 */
export const openChatWith = async (
	currentUserId: string,
	recipient: User,
	setChatId: (id: string) => void,
	navigate: NavigateFunction,
): Promise<void> => {
	const chatId = [currentUserId, recipient.uid].sort().join('_');
	await createOrFetchChat(currentUserId, recipient.uid as string, setChatId);
	const chatSnap = await getDoc(doc(db, "chats", chatId));
	const chat = chatSnap.exists() ? chatSnap.data() as Chat : null;
	navigate(`/dashboard/chat?recipient-user-id=${recipient.uid}`, {
		state: {chatId, recipientUser: recipient, chatUnlocked: isChatWindowActive(chat)},
	});
};

export const getLastValidMessage = async (chat: Chat, currentUserUid: string) => {
	const chatId = `${chat.participants.sort().join('_')}`;
	const messagesRef = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp", "desc"));
	try {
		const messagesSnap = await getDocs(messagesRef);
		const messages = messagesSnap.docs.map((doc) => ({
			...doc.data(),
			id: doc.id,
		})) as Messages[] ;
		const validMessage = messages.find(
			(msg) => !msg.sender_id_blocked || msg.sender_id === currentUserUid
		);
		return validMessage ? validMessage : null;
	} catch (error) {
		console.error("Error fetching messages:", error);
		return "Error loading message";
	}
};
