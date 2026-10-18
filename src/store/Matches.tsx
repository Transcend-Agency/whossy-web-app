import { create } from 'zustand';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, or } from 'firebase/firestore';
import { db } from '@/firebase'; // Adjust the path to your Firebase config
import { Match } from '@/types/likingAndMatching';
import { User } from '@/types/user';
import useDashboardStore from '@/store/useDashboardStore';
import {useAuthStore} from "@/store/UserId.tsx";
import { fetchHiddenUserIds } from "@/utils/blocking";

export interface PopulatedMatchData extends Match {
    matchedUserData: User | null; // Ensure this matches your User type
}

/**
 * Calls `onChange` whenever a match involving `userId` is added or removed
 * (not for the initial load). The server writes a match from the two likes a
 * moment after the second one, so the lists need telling.
 */
export const watchMatches = (userId: string, onChange: () => void) => {
    let initial = true;
    const matchesQuery = query(
        collection(db, 'matches'),
        or(where('user1_id', '==', userId), where('user2_id', '==', userId))
    );
    return onSnapshot(
        matchesQuery,
        () => {
            if (initial) { initial = false; return; }
            onChange();
        },
        (error) => console.error('Match watcher failed:', error)
    );
};

// Two users are "connected" when a `matches` doc exists containing both UIDs,
// in either user1_id/user2_id slot.
export const isConnectedTo = (matches: PopulatedMatchData[], otherUid?: string | null): boolean => {
    if (!otherUid) return false;
    return matches.some(match => match.user1_id === otherUid || match.user2_id === otherUid);
};

interface MatchStore {
    matches: PopulatedMatchData[];
    loading: boolean;
    // `silent` refetches without flipping `loading`, so a live update does not
    // blank the list while it reloads.
    fetchMatches: (userId: string, silent?: boolean) => Promise<void>;
}

export const useMatchStore = create<MatchStore>((set) => ({
    matches: [],
    loading: true,
    fetchMatches: async (userId: string, silent = false) => {
        if (!userId) {
            console.error("Invalid userId provided");
            return;
        }


        try {
            if (!silent) set({ loading: true });

            const { setBlockedUsers } = useDashboardStore.getState();
            const { user } = useAuthStore.getState();
            const fetchBlockedUsers = async () => {
                try {
                    if (!user?.uid) {
                        console.error("Invalid userId provided");
                        return;
                    }

                    const blockedIds = await fetchHiddenUserIds(user.uid);
                    setBlockedUsers(blockedIds);
                    return blockedIds;
                } catch (error) {
                    console.error("Error fetching blocked users:", error);
                    return [];
                }
            };

            const blockedUsers = (await fetchBlockedUsers()) ?? [];

            // Fetch matches
            const matchesRef = collection(db, 'matches');
            const matchesQuery = query(
                matchesRef,
                or(
                    where('user1_id', '==', userId),
                    where('user2_id', '==', userId)
                )
            );

            const matchesSnapshot = await getDocs(matchesQuery);

            const populateUserData = async (match: Match) => {
                const matchedUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
                const matchedUserDoc = await getDoc(doc(db, 'users', matchedUserId));
                if (!matchedUserDoc.exists()) {
                    return null;
                }
                const matchedUserData = matchedUserDoc.data() as User;
                if (matchedUserData.is_banned) {
                    return null;
                }
                return {
                    ...match,
                    matchedUserData
                };
            };

            const allMatches = await Promise.all(
                matchesSnapshot.docs.map((doc) => populateUserData(doc.data() as Match))
            );

            const uniqueMatchIds = new Set<string>();
            const filteredMatches = allMatches
                .filter(match => match != null)
                .filter((match) => {
                const matchedUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
                if (blockedUsers.includes(matchedUserId)) {
                    return false;
                }
                const matchKey = [match.user1_id, match.user2_id].sort().join('_');
                if (!uniqueMatchIds.has(matchKey)) {
                    uniqueMatchIds.add(matchKey);
                    return true;
                }
                return false;
            });

            set({ matches: filteredMatches as PopulatedMatchData[], loading: false });
        } catch (error) {
            console.error("Error fetching matches:", error);
            set({ loading: false });
        }
    },
}));
