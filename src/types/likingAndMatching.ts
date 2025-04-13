import { User } from "./user";
import {Timestamp} from "firebase/firestore";

export interface Like {
    liker_id: string;
    liked_id: string;
    timestamp: Timestamp;
}

export interface Dislike {
    disliker_id: string;
    disliked_id: string;
    timestamp: Timestamp;
}

export interface Match {
    user1_id: string,
    user2_id: string,
    timestamp: Timestamp,
}

export interface PopulatedLikeData extends Like {
    liker: User
}

export interface PopulatedLikedByData extends Like {
    liked: User
}