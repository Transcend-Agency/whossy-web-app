import {doc, getDoc} from "firebase/firestore";
import {db} from "@/firebase";
import {User} from "@/types/user";

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
