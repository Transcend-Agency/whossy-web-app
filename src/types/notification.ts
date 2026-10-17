import { Timestamp } from "firebase/firestore";

export type NotificationType = "like" | "match" | "message" | "verification";

export type Notifications = {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    seen: boolean;
    timestamp: Timestamp;

    // type: 'like'
    likerId?: string;
    likerName?: string;
    likerProfilePicture?: string;
    likedId?: string;

    // type: 'match'
    user1_id?: string;
    user1_name?: string;
    user1_pic?: string;
    user2_id?: string;
    user2_name?: string;
    user2_pic?: string;

    // type: 'message'
    chatId?: string;
    senderId?: string;
    senderName?: string;
    senderProfilePicture?: string;

    // type: 'verification'
    verificationStatus?: "approved" | "rejected";
    rejectionReason?: string | null;
}
