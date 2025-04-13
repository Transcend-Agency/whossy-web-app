import { useState, useEffect } from 'react';
import { db } from '@/firebase'; // your Firebase configuration
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import {Like, PopulatedLikedByData} from '../types/likingAndMatching'; // your Like interface & type for populated
// like data
import { useAuthStore } from '@/store/UserId';
import useDashboardStore from "@/store/useDashboardStore.tsx";
import { User } from "@/types/user.ts";

function useSyncPeopleWhoUserLiked() {
		const { user } = useAuthStore();
		const { peopleYouLiked, setPeopleYouLiked, blockedUsers } = useDashboardStore();
		const [loading, setLoading] = useState<boolean>(true);

		useEffect(() => {
				if (!user?.uid) return;

				// Reference to the "likes" collection in Firestore
				const likesRef = collection(db, 'likes');
				// Query for likes where the current user is the liker
				const q = query(likesRef, where('liker_id', '==', user.uid));
				// This function fetches the liked user's data for a given like
				const populateLikedData = async (like: Like) => {
						const likedDoc = await getDoc(doc(db, 'users', like.liked_id));
						if (!likedDoc.exists()) {
								return null;
						}

						const likedUserData = likedDoc.data() as User;
						// Optionally, you can filter out banned or unapproved users
						if (likedUserData.is_banned || likedUserData.is_approved === false) {
								return null;
						}

						return {
								...like,
								liked: likedUserData, // attach the liked user's details
						} as PopulatedLikedByData;
				};

				// Set up a real-time listener to keep the liked data in sync
				const unsubscribe = onSnapshot(q, async (snapshot) => {
						const likes = await Promise.all(
								snapshot.docs.map(async (doc) => {
										const like = doc.data() as Like;
										return await populateLikedData(like);
								})
						);

						// Filter out any likes that did not successfully populate and those where the liked user is blocked
						const filteredLikes = likes
								.filter((like) => like !== null)
								.filter((like) => !blockedUsers.includes(like!.liked_id));
						setPeopleYouLiked(filteredLikes as PopulatedLikedByData[]);
						setLoading(false);
				});

				// Clean up the listener on component unmount
				return () => unsubscribe();
		}, [user?.uid, blockedUsers]);

		return { peopleYouLiked, loading };
}

export default useSyncPeopleWhoUserLiked;
