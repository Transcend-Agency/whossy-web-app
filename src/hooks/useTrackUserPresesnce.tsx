import { useEffect } from 'react';
import { ref, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '@/firebase';
import { useAuthStore } from '@/store/UserId';

const useTrackUserPresence = () => {
    const { user } = useAuthStore()
    useEffect(() => {
        if (!user?.uid) return

        const presenceRef = ref(realtimeDb, `users/${user?.uid}/presence`);


        // Set the user's presence status to online
        set(presenceRef, { online: true, lastSeen: serverTimestamp() }).catch(err => console.log(err))

        // Handle disconnect
        const disconnectedRef = onDisconnect(presenceRef);
        disconnectedRef.set({ online: false, lastSeen: serverTimestamp() }).catch(err => console.log(err));

        // Cleanup
        return () => {
            disconnectedRef.cancel().catch(err => console.log(err));
        };
    }, [user?.uid]);
};

export default useTrackUserPresence;