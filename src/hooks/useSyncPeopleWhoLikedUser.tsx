import { useState, useEffect } from 'react';
import { db } from '@/firebase'; // import your Firebase config
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Like, PopulatedLikeData } from '../types/likingAndMatching'; // import your Like interface
import { useAuthStore } from '@/store/UserId';
import useDashboardStore from "@/store/useDashboardStore.tsx";
import {User} from "@/types/user.ts";

function useSyncPeopleWhoLikedUser() {
    const { user } = useAuthStore()
    const { peopleWhoLiked, setPeopleWhoLiked, blockedUsers} = useDashboardStore()
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!user?.uid) return;

        // Firestore reference to the "likes" collection
        const likesRef = collection(db, 'likes');
        // Firestore query to filter where `liked_id` matches the current user (people who liked the user)
        const q = query(likesRef, where('liked_id', '==', user.uid));

        const populateLikerData = async (like: Like) => {
            const likerDoc = await getDoc(doc(db, 'users', like.liker_id));
            if (!likerDoc.exists()) {
                return null;
            }

            const likerData = likerDoc.data() as User;
            if (likerData.is_banned || likerData.is_approved == false)
                return null;

            return {
                ...like,
                liker: likerData // Add liker user data to the like
            } as PopulatedLikeData;
        };

        // setLoading(true)
        // Real-time listener that automatically syncs the people who liked the current user
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const likes = await Promise.all(
                snapshot.docs.map(async (doc) => {
                    const like = doc.data() as Like;
                    return await populateLikerData(like); // Get liker's details for each like
                })
            );

            const filteredLikes = likes
                .filter(like => like !== null)
                .filter(like => !blockedUsers.includes(like!.liker_id));
            setPeopleWhoLiked(filteredLikes as PopulatedLikeData[]); // Sync the state with the latest data
            setLoading(false);         // Set loading to false after fetching
        });

        // Cleanup the listener on component unmount
        return () => unsubscribe();
    }, [user?.uid, blockedUsers]);

    return { peopleWhoLiked, loading };
}

export default useSyncPeopleWhoLikedUser;
