import { useState, useEffect } from 'react';
import { db } from '@/firebase'; // import your Firebase config
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Dislike } from '../types/likingAndMatching'; // import your Like interface

function useSyncUserDislikes(userId: string) {
    const [userDislikes, setUserDislikes] = useState<Dislike[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Firestore reference to the "dislikes" collection
        const dislikesRef = collection(db, 'dislikes');

        // Firestore query to filter where `disliker_id` matches the current user
        const q = query(dislikesRef, where('disliker_id', '==', userId));

        // Real-time listener that automatically syncs the dislikes for the current user
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const dislikes: Dislike[] = snapshot.docs.map((doc) => ({
                ...doc.data(),
            }) as Dislike); // Cast the data as the Like interface

            setUserDislikes(dislikes); // Sync the state with the latest data
            setLoading(false); // Set loading to false once data is fetched
        });

        // Cleanup the listener on component unmount
        return () => unsubscribe();
    }, [userId]);

    return { userDislikes, loading };
}

export default useSyncUserDislikes;
