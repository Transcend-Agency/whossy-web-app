import { useEffect } from 'react';
import { ref, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '@/firebase';
import { useAuthStore } from '@/store/UserId';

// How often to refresh lastSeen while the app is foregrounded, so "online"
// reflects genuine recent activity rather than only the last connect/reconnect
// event (a force-quit or lost signal can leave onDisconnect unfired for a while).
const HEARTBEAT_INTERVAL_MS = 90 * 1000;

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

        const heartbeat = setInterval(() => {
            set(presenceRef, { online: true, lastSeen: serverTimestamp() }).catch(err => console.log(err));
        }, HEARTBEAT_INTERVAL_MS);

        // Cleanup
        return () => {
            clearInterval(heartbeat);
            disconnectedRef.cancel().catch(err => console.log(err));
        };
    }, [user?.uid]);
};

export default useTrackUserPresence;