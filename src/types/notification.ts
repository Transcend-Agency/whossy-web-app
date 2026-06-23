import { Timestamp } from "firebase/firestore";

export type Notifications = {
    id: string;
    likedId: string;
    likerId: string;
    likerName: string;
    likerProfilePicture: string;
    seen: boolean;
    timestamp: Timestamp;
    title: string;
    user1_id: string
    user1_name: string
    user1_pic: string
    user2_id: string
    user2_name: string
    user2_pic: string
}