import { useState, useEffect } from 'react';
import { db } from '@/firebase'; // import your Firebase config
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Like } from '../types/likingAndMatching'; // import your Like interface

function useSyncUserLikes(userId: string) {
  const [userLikes, setUserLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Firestore reference to the "likes" collection
    const likesRef = collection(db, 'likes');

    // Firestore query to filter where `liker_id` matches the current user
    const q = query(likesRef, where('liker_id', '==', userId));

    // Real-time listener that automatically syncs the likes for the current user
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const likes: Like[] = snapshot.docs.map((doc) => ({// optional, if you want to store document ID
        ...doc.data(),
      }) as Like); // Cast the data as the Like interface

      setUserLikes(likes); // Sync the state with the latest data
      setLoading(false); // Set loading to false once data is
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, [userId]);

  return {userLikes, loading};
}

export default useSyncUserLikes;