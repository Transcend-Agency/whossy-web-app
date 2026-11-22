import {useCallback, useRef, useState} from "react";
import {collection, doc, getDoc, getDocs, limit, orderBy, query, Query, QueryDocumentSnapshot, startAfter, Timestamp, where} from "firebase/firestore";
import {db} from "@/firebase";
import {User, UserFilters, UserProfile} from "@/types/user.ts";
import useDashboardStore from "@/store/useDashboardStore.tsx";
import {useAuthStore} from "@/store/UserId.tsx";
import {RECENCY_WINDOW_MS} from "@/utils/presence.ts";
import {AGE_RANGE_OPTION, NEW_MEMBER_WINDOW_DAYS} from "@/constants";
import {fetchSearchRadiusMiles, fetchUserFilters} from "@/utils/searchRadius.ts";
import {activeAgeRange, birthDateBounds, myAgeRange} from "@/utils/ageFilter.ts";
import {milesToKm} from "@/utils/units.ts";
import {fetchProfilesWithinRadius} from "@/utils/geoProfiles.ts";
import { fetchHiddenUserIds } from "@/utils/blocking";

// C5 — Discover/Online/New members/Looking to date are simple where()-only
// queries and paginate cleanly with a cursor. Similar interest, Advanced
// Search, Outside my country and Popular in my area all re-sort or
// client-filter the result set, which doesn't compose with a server cursor
// without a lot more machinery — they get one generous page instead of true
// "load more" for now (capped, not silently unbounded).
const PROFILES_PAGE_SIZE = 24;
const UNPAGINATED_BRANCH_LIMIT = 60;
// Most pages of UNPAGINATED_BRANCH_LIMIT Advanced Search reads looking for matches.
const ADVANCED_SEARCH_MAX_PAGES = 5;

function useProfileFetcher() {
	const { user } = useAuthStore()
	const { profiles, blockedUsers, setBlockedUsers, setProfiles, selectedOption, setExploreDataLoading, setExploreError, setExploreEmptyReason, hasMoreProfiles, setHasMoreProfiles, advancedSearchPreferences} = useDashboardStore()
	const cursorRef = useRef<QueryDocumentSnapshot | null>(null);
	const [loadingMoreProfiles, setLoadingMoreProfiles] = useState(false);

	const fetchBlockedUsers = useCallback(async () => {
		if (!user?.uid) return [];
		try {
			const blockedIds = await fetchHiddenUserIds(user.uid)
			setBlockedUsers(blockedIds);
			return blockedIds;
		} catch (error) {
			console.error("Error fetching blocked users:", error);
			return [];
		}
	}, [user?.uid]);

	const filterBlockedAndCurrentUser = (userData: User[], blockedUsers: string[]) => {
		return userData.filter(u => !blockedUsers.includes(u.uid as string) && u.uid !== user?.uid);
	};

	const fetchBlockedAndFilteredProfiles = async (queryParam: Query, options: { append?: boolean, paginated?: boolean } = {}) => {
		const { append = false, paginated = false } = options;
		if (append) {
			setLoadingMoreProfiles(true);
		} else {
			setExploreDataLoading(true);
			cursorRef.current = null;
			setHasMoreProfiles(false);
		}
		setExploreError(null);
		setExploreEmptyReason(null);
		try {
			let data: UserProfile[]
			let nextCursor: QueryDocumentSnapshot | null = null;
			if (!user?.uid) return [];
			const userRef = doc(db, "users", user.uid);
			const userDoc = await getDoc(userRef);
			const userInfo = userDoc.exists() ? userDoc.data() : {};
			const userInterest: string[] = userInfo.interests || []
			const interestsFilter: boolean = userInterest.length > 0;

			if (selectedOption === "Similar interest") {
				if (!interestsFilter) {
					// Falling through to an unfiltered query here used to silently
					// show everyone under a filter labeled "Similar interest" — tell
					// the viewer why instead.
					setExploreEmptyReason("no-interests");
					data = [];
				} else {
					const querySnapshot = await getDocs(query(getUsers(user), where("interests", "array-contains-any", userInterest), limit(UNPAGINATED_BRANCH_LIMIT)))
					const matched = querySnapshot.docs.map(doc => doc.data() as UserFilters)

					data = matched.sort((a, b) => {
						const interestsA = a.interests || [];
						const interestsB = b.interests || [];
						const sharedA = userInterest.filter((interest) => interestsA.includes(interest)).length;
						const sharedB = userInterest.filter((interest) => interestsB.includes(interest)).length;
						return sharedB - sharedA;
					});
				}
			} else if (selectedOption === "Advanced Search") {
				// Age is the Preferences age filter (one setting in both places),
				// applied in the query when it's on. The other options here
				// (gender/country/preference/religion) would each need their own
				// composite index in combination, so they're checked client-side
				// over pages of results, reading on until there are enough
				// matches or nobody left. It used to stop after the first 60
				// profiles, so a narrow search could come back almost empty.
				const ageRange = activeAgeRange(await fetchUserFilters(user.uid));
				let searchQuery = query(getUsers(user), orderBy("created_at"));
				if (ageRange) {
					const { bornOnOrBefore, bornAfter } = birthDateBounds(ageRange);
					searchQuery = query(
						getUsers(user),
						where("date_of_birth", "<=", Timestamp.fromDate(bornOnOrBefore)),
						where("date_of_birth", ">", Timestamp.fromDate(bornAfter)),
						orderBy("date_of_birth")
					);
				}

				const matches = (u: User) => {
					if (advancedSearchPreferences.gender && u.gender !== advancedSearchPreferences.gender) return false;

					// The user document records this as `country_of_origin` — the
					// filter preference's field is just named `country`.
					if (advancedSearchPreferences.country && u.country_of_origin !== advancedSearchPreferences.country) return false;

					// `relationship_preference`/`religion` are enum indices where 0
					// is a real, meaningful first option — a truthiness check
					// silently dropped the filter whenever someone chose it. Check
					// for "unset" explicitly instead.
					if (advancedSearchPreferences.relationship_preference != null && u.preference !== advancedSearchPreferences.relationship_preference) return false;

					if (advancedSearchPreferences.religion != null && u.religion !== advancedSearchPreferences.religion) return false;

					return true;
				};

				const found: User[] = [];
				let cursor: QueryDocumentSnapshot | null = null;
				for (let page = 0; page < ADVANCED_SEARCH_MAX_PAGES && found.length < UNPAGINATED_BRANCH_LIMIT; page++) {
					const pageQuery: Query = cursor
						? query(searchQuery, startAfter(cursor), limit(UNPAGINATED_BRANCH_LIMIT))
						: query(searchQuery, limit(UNPAGINATED_BRANCH_LIMIT));
					const snapshot = await getDocs(pageQuery);
					found.push(...snapshot.docs.map((d) => d.data() as User).filter(matches));
					if (snapshot.docs.length < UNPAGINATED_BRANCH_LIMIT) break;
					cursor = snapshot.docs[snapshot.docs.length - 1];
				}
				data = found;
			} else if (selectedOption === AGE_RANGE_OPTION) {
				// The viewer's age range, even while the age filter itself is off
				// (the last range they chose). Without one there's nothing to
				// show, and the empty state says how to set it.
				const range = myAgeRange(await fetchUserFilters(user.uid));
				if (!range) {
					setExploreEmptyReason("no-age-range");
					data = [];
				} else {
					const { bornOnOrBefore, bornAfter } = birthDateBounds(range);
					const rangeQuery = query(
						getUsers(user),
						where("date_of_birth", "<=", Timestamp.fromDate(bornOnOrBefore)),
						where("date_of_birth", ">", Timestamp.fromDate(bornAfter)),
						orderBy("date_of_birth")
					);
					const pageQuery = append && cursorRef.current
						? query(rangeQuery, startAfter(cursorRef.current), limit(PROFILES_PAGE_SIZE))
						: query(rangeQuery, limit(PROFILES_PAGE_SIZE));
					const querySnapshot = await getDocs(pageQuery);
					data = querySnapshot.docs.map(doc => doc.data() as User);
					nextCursor = querySnapshot.docs[querySnapshot.docs.length - 1] ?? null;
					setHasMoreProfiles(querySnapshot.docs.length === PROFILES_PAGE_SIZE);
				}
			} else if (selectedOption === "Outside my country") {
				const querySnapshot = await getDocs(query(queryParam, limit(UNPAGINATED_BRANCH_LIMIT)));
				const userData = querySnapshot.docs.map(doc => doc.data() as User);
				// Firestore's `!=` excludes documents where the field is missing
				// entirely, so a profile with no country recorded used to vanish
				// from this filter instead of counting as "outside". Filtering
				// client-side treats "missing" the same as "different".
				data = userData.filter(u => u.country_of_origin !== user?.country_of_origin);
			} else if (selectedOption === "Popular in my area") {
				// A real area bound (the viewer's saved search radius) and a real
				// popularity signal (functions/src/popularity.ts's rolling 30-day
				// like count) — this used to just re-run the "same country" query
				// under a different label.
				if (typeof user?.latitude !== "number" || typeof user?.longitude !== "number") {
					data = [];
				} else {
					// The Preferences radius (filters/{uid}). user.distance is only
					// the onboarding value and isn't updated when Preferences changes.
					const radiusKm = milesToKm(await fetchSearchRadiusMiles(user.uid as string, user.distance));
					const results = await fetchProfilesWithinRadius(getUsers(user), [user.latitude, user.longitude], radiusKm);
					data = results
						.sort((a, b) => (b.profile.popularity_score_30d ?? 0) - (a.profile.popularity_score_30d ?? 0) || a.distanceKm - b.distanceKm)
						.map(r => r.profile);
				}
			} else {
				// Discover / Online / New members / Looking to date — plain
				// where()-only queries, paginate cleanly with a cursor.
				let pagedQuery = paginated ? query(queryParam, limit(PROFILES_PAGE_SIZE)) : queryParam;
				if (paginated && append && cursorRef.current) {
					pagedQuery = query(queryParam, startAfter(cursorRef.current), limit(PROFILES_PAGE_SIZE));
				}
				const querySnapshot = await getDocs(pagedQuery);
				data = querySnapshot.docs.map(doc => doc.data() as User);
				if (paginated) {
					nextCursor = querySnapshot.docs[querySnapshot.docs.length - 1] ?? null;
					setHasMoreProfiles(querySnapshot.docs.length === PROFILES_PAGE_SIZE);
				}
			}

			cursorRef.current = nextCursor;
			const filtered = filterBlockedAndCurrentUser(data as User[], blockedUsers);
			setProfiles(append ? [...profiles, ...filtered] : filtered);
		} catch (error) {
			console.error("Error fetching profiles:", error);
			setExploreError(error instanceof Error ? error.message : "Something went wrong loading profiles.");
			if (!append) setProfiles([]);
		} finally {
			setExploreDataLoading(false);
			setLoadingMoreProfiles(false);
		}
	};

	const refreshProfiles = useCallback(async () => {
		try {
			const blockedIds = await fetchBlockedUsers().then(async () => {
				console.log("Blocked users refreshed successfully", blockedIds)
				await fetchProfilesBasedOnOption().catch((err) => console.error("Refreshed UnSuccessful", err))
			})
		} catch (error) {
			console.error("Error refreshing profiles:", error);
		}
	}, [fetchBlockedUsers]);

	const getUsers = (user?: User) => {
		const usersCollection = collection(db, "users");
		const q_base = query(usersCollection,
			where("has_completed_onboarding", "==", true));
		let q;
		if (user) {
			const userGender = user.gender;
			if (user.meet === 2) {
				q = query(q_base,
					where("meet", "in", [2, userGender === "Male" ? 0 : 1])
				);
			} else if (user.meet === 0 || user.meet === 1) {
				const targetGender = user.meet === 0 ? "Male" : "Female";
				q = query(q_base,
					where("gender", "==", targetGender),
					// where("meet","in", [2, user.meet === 0 ? 1 : 0])
				);
			} else {
				throw new Error("Invalid meet value provided.");
			}
		} else {
			q = q_base;
		}
		return q;
	};

	// Branches that paginate need an orderBy matching whichever field (if any)
	// carries the range filter — Firestore requires the first orderBy to be
	// the inequality's own field.
	const fetchProfilesBasedOnOption = async (append = false) => {
		let fetchQuery;
		let paginated = false;
		const q = getUsers(user);
		switch (selectedOption) {
			case "Discover":
				fetchQuery = query(q, orderBy("created_at"));
				paginated = true;
				break;
			case "Similar interest":
				// Handled entirely inside fetchBlockedAndFilteredProfiles (needs
				// the viewer's own interests, fetched there).
				fetchQuery = query(q);
				break;
			case "Online":
				fetchQuery = query(q, where("status.lastSeen", ">=", Date.now() - RECENCY_WINDOW_MS), orderBy("status.lastSeen"));
				paginated = true;
				break;
			case "Popular in my area":
				// Handled entirely inside fetchBlockedAndFilteredProfiles — a real
				// geo-bounded query sorted by popularity, not expressible as a
				// single where() clause here.
				fetchQuery = query(q);
				break;
			case "New members": {
				const cutoff = new Date();
				cutoff.setDate(cutoff.getDate() - NEW_MEMBER_WINDOW_DAYS);
				fetchQuery = query(q, where("created_at", ">=", Timestamp.fromDate(cutoff)), orderBy("created_at"));
				paginated = true;
				break;
			}
			case "Looking to date":
				fetchQuery = query(q, where("preference", "==", 0), orderBy("created_at"));
				paginated = true;
				break;
			case "Outside my country":
				// Handled entirely inside fetchBlockedAndFilteredProfiles — a
				// server-side `!=` silently drops profiles with no country
				// recorded, so exclusion happens client-side instead.
				fetchQuery = query(q);
				break;
			case "Advanced Search":
				fetchQuery = query(q)
				break;
			case AGE_RANGE_OPTION:
				// Handled inside fetchBlockedAndFilteredProfiles: it needs the
				// viewer's saved age range, read there.
				fetchQuery = query(q);
				paginated = true;
				break;
			default:
				console.log("Option not recognized");
				return;
		}
		await fetchBlockedAndFilteredProfiles(fetchQuery, { append, paginated });
	};

	const loadMoreProfiles = useCallback(async () => {
		if (!hasMoreProfiles || loadingMoreProfiles) return;
		await fetchProfilesBasedOnOption(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasMoreProfiles, loadingMoreProfiles, selectedOption]);


	return { refreshProfiles, fetchBlockedUsers, fetchProfilesBasedOnOption, fetchBlockedAndFilteredProfiles, loadMoreProfiles, hasMoreProfiles, loadingMoreProfiles }
}

export default useProfileFetcher;
