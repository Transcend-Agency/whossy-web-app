import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";

/**
 * Everyone who should be invisible to `uid`: people they blocked plus people
 * who blocked them. A block is mutual from the user's point of view, but only
 * the blocker's document records it (`blockedIds`), so the second half needs a
 * reverse lookup. If that lookup fails we fall back to the one-way list rather
 * than hiding nothing.
 */
export const fetchHiddenUserIds = async (uid: string): Promise<string[]> => {
    const ownDoc = await getDoc(doc(db, "users", uid));
    const blockedByMe: string[] = (ownDoc.exists() ? ownDoc.data().blockedIds : null) || [];

    let blockedMe: string[] = [];
    try {
        const snap = await getDocs(query(collection(db, "users"), where("blockedIds", "array-contains", uid)));
        blockedMe = snap.docs.map(d => d.id);
    } catch (error) {
        console.error("Couldn't look up who blocked this user:", error);
    }

    return Array.from(new Set([...blockedByMe, ...blockedMe]));
};
