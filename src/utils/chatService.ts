import {collection, doc, getDoc, getDocs, orderBy, query, setDoc, Timestamp} from "firebase/firestore";
import { db } from "@/firebase";
import {checkIfUserBlocked} from "@/components/dashboard/SelectedChat.tsx";
import {Chat, Messages} from "@/types/chat.ts";

export const createOrFetchChat = async ( currentUserId: string,  recipientUserId: string, updateChatId: (id: string) => void): Promise<void> => {
	const newChatId = [currentUserId, recipientUserId].sort().join('_');
	const chatDocRef = doc(db, "chats", newChatId);

	const chatDocSnap = await getDoc(chatDocRef);

	if (!chatDocSnap.exists()) {
		const currentUserBlockedRecipient = await checkIfUserBlocked(currentUserId, recipientUserId);
		const recipientBlockedCurrentUser = await checkIfUserBlocked(recipientUserId, currentUserId);
		const userBlockedStatus = [currentUserBlockedRecipient, recipientBlockedCurrentUser];

		const getExpirationTime = () => {
			const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
			return Timestamp.fromMillis(Date.now() + oneWeekInMs);
		};

		await setDoc(chatDocRef, {
			last_message: null,
			last_message_id: null,
			last_sender_id: null,
			user_blocked: userBlockedStatus,
			participants: [currentUserId, recipientUserId],
			status: 'inactive',
			last_message_timestamp: null,
			unlock_time: Timestamp.now(),
			expiration_time: getExpirationTime(),
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
