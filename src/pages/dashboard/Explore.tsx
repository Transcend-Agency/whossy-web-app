import {collection, getDocs} from "firebase/firestore";
import { AnimatePresence, motion } from 'framer-motion';
import { query, Timestamp, where } from "firebase/firestore";
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import DashboardPageContainer from '../../components/dashboard/DashboardPageContainer';
import ExploreGridProfile from '../../components/dashboard/ExploreGridProfile';
import { AgeRangeModal, CountrySettingsModal, GenderSettingsModal, RelationshipPreferenceSettingsModal, ReligionSettingsModal } from '@/components/dashboard/EditProfileModals';
import SettingsGroup from '@/components/dashboard/SettingsGroup';
import { filterOptions, preference, religion, NEW_MEMBER_WINDOW_DAYS } from '@/constants';
import useSyncUserLikes from '@/hooks/useSyncUserLikes';
import { getAdvancedSearchPreferences, updateAdvancedSearchPreferences } from '@/hooks/useUser';
import { useAuthStore } from '@/store/UserId';
import { Like } from '@/types/likingAndMatching';
import { AdvancedSearchPreferences, User } from '@/types/user';
import { calculateAge } from '@/utils/age';
import { Oval } from 'react-loader-spinner';
import DiscoveryStateMessage from '@/components/dashboard/DiscoveryStateMessage';
import { db } from "@/firebase";
import useLikesAndMatchesStore from "@/store/LikesAndMatches.tsx";
import CustomIcon from "@/components/dashboard/CustomIcon.tsx";
import useDashboardStore from "@/store/useDashboardStore.tsx";
import useProfileFetcher from "@/hooks/useProfileFetcher.tsx";
import ViewProfile from "@/components/dashboard/ViewProfile";
import {useNavigationStore} from "@/store/NavigationStore.tsx";

interface SettingsDataItem {
    label: string;
    value: string;
    onClick: () => void;
}

const Explore = () => {

    const {
        profiles,
        selectedProfile,
        setSelectedProfile,
        blockedUsers,
        selectedOption,
        setSelectedOption,
        exploreDataLoading,
        exploreError,
        exploreEmptyReason,
        advancedSearchPreferences,
        setAdvancedSearchPreferences
    } = useDashboardStore()
    const { fetchBlockedUsers, fetchProfilesBasedOnOption, refreshProfiles, loadMoreProfiles, hasMoreProfiles, loadingMoreProfiles } = useProfileFetcher()

    const { auth, user } = useAuthStore();
    const { setLikes } = useLikesAndMatchesStore()
    const { userLikes } = useSyncUserLikes(user!.uid!);

    const loadingData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    const [resetLoading, setResetLoading] = useState(false)

    const [advancedSearchShowing, setAdvancedSearchShowing] = useState(false)
    const [advancedSearchModalShowing, setAdvancedSearchModalShowing] = useState('hidden')
    const hideModal = () => setAdvancedSearchModalShowing('hidden')
    const { setActivePage: setPage } = useNavigationStore()

    useEffect(() => {
        setPage('user-profile')
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            await fetchBlockedUsers();
        };
        fetchData().catch((err) => console.error("An error occurred while trying to fetch blocked users: ", err))
    }, [fetchBlockedUsers]);

    const fetchLikes = async () => {
        const likesCollection = collection(db, 'likes');
        const q = query(likesCollection, where("liker_id", "==", user?.uid));
        const likesSnapshot = await getDocs(q);

        const likes = likesSnapshot.docs.map(like => like.data() as Like)
        setLikes(likes)
    }

    const hasUserBeenLiked = (id: string) => {
        return Boolean(userLikes.filter(like => (like.liked_id === id)).length)
    }

    useEffect(() => {
        fetchLikes().catch((err) => console.error("An error occurred while trying to fetch Likes: ", err))
        fetchProfilesBasedOnOption().catch((err) => console.error("An error occurred while trying to fetch profiles: ", err))
        fetchSearchPreferences().catch(e => console.log(e))
    }, [selectedOption, blockedUsers]);

    const isNewUserFromDate = (timestampDate: string) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - NEW_MEMBER_WINDOW_DAYS);
        // @ts-expect-error Firebase timestamp comparison
        return timestampDate >= Timestamp.fromDate(cutoff);
    };

    const fetchSearchPreferences = async () => {
        const data = await getAdvancedSearchPreferences(user?.uid as string) as AdvancedSearchPreferences;
        setAdvancedSearchPreferences(data)
    }

    const refetchSearchPreferences = async () => {
        await fetchSearchPreferences()
    }

    const updateSearchPreferences = async (s: AdvancedSearchPreferences) => {
        await updateAdvancedSearchPreferences(user?.uid as string, () => {
            hideModal();
            refetchSearchPreferences()
        }, s)
    }

    const resetAdvancedSearch = async () => {
        console.log('This is being called');
        try {
            setResetLoading(true);
            await updateAdvancedSearchPreferences(auth?.uid as string, () => refetchSearchPreferences() ,
                {
                    gender: '',
                    age_range: { min: 18, max: 100 },
                    country: '',
                    relationship_preference: null,
                    religion: null,
                }
            ).then(() => setResetLoading(false))
        } catch (e) {
            console.error('Error refreshing document:', e);
        }
    };

    const settingsData: SettingsDataItem[] = [
        { label: 'Gender', value: advancedSearchPreferences.gender || 'Choose', onClick: () => setAdvancedSearchModalShowing('gender') },
        { label: 'Age', value: `${advancedSearchPreferences.age_range?.min} - ${advancedSearchPreferences.age_range?.max} years old` || 'Choose', onClick: () => setAdvancedSearchModalShowing('age-range') },
        { label: 'Country of Residence', value: advancedSearchPreferences.country || 'Choose', onClick: () => setAdvancedSearchModalShowing('country') },
        { label: 'Relationship Preference', value: advancedSearchPreferences.relationship_preference !== null ? preference[advancedSearchPreferences.relationship_preference as number] : 'Choose', onClick: () => setAdvancedSearchModalShowing('relationship_preference') },
        { label: 'Religion', value: advancedSearchPreferences.religion !== null ? religion[advancedSearchPreferences.religion as number] : 'Choose', onClick: () => setAdvancedSearchModalShowing('religion') }
    ];

    const noSearchResults = (profiles: User[]): number => {
        return profiles.filter(user => user.is_approved === true && user?.user_settings?.public_search === true && user.is_banned === false).length;
    };

    const noSearchResult = (profiles: User[]): User[] => {
        return profiles.filter(user => user.is_approved === true && user?.user_settings?.public_search === true && user.is_banned === false);
    };

    // useEffect(() => {
    //     setSelectedProfile(null)
    //     return () => setSelectedProfile(null)
    // }, [])

    return <>
        {!selectedProfile &&
            <>
                {
                    !advancedSearchShowing && <DashboardPageContainer className='explore-page h-screen lg:h-auto flex flex-col' span={2}>
                        <div className='explore flex-grow'>
                            <div className='filter'>
                                <div className='filter__left'>
                                    {filterOptions.map(item => <div key={item} onClick={() => setSelectedOption(item)} className={`filter__item ${selectedOption == item && 'filter__item--active'}`}>{item}</div>)}
                                    <div onClick={() => setSelectedOption('Advanced Search')} className={`filter__item advanced-search-btn2 ${selectedOption == 'Advanced Search' && 'filter__item--active'}`}>
                                        <CustomIcon />
                                        Advanced Search
                                    </div>
                                </div>
                                <div data-cy="advanced-search-btn-mobile">
                                    <div className='filter__right advanced-search-btn'>
                                        <button onClick={() => setAdvancedSearchShowing(true)}
                                                className='filter__saved-search'>
                                            <img src="/assets/icons/saved-search.svg" alt={``}/>
                                        </button>
                                    </div>
                                </div>
                                <div className='explore-grid-gradient-top'></div>
                            </div>
                            <div className='explore-grid-container'>
                                <AnimatePresence>
                                    {!exploreDataLoading && exploreError &&
                                        <DiscoveryStateMessage
                                            key="explore-error"
                                            title="Couldn't load profiles"
                                            subtitle={exploreError}
                                            actionLabel="Try again"
                                            onAction={() => fetchProfilesBasedOnOption().catch((err) => console.error("An error occurred while trying to fetch profiles: ", err))}
                                        />
                                    }

                                    {!exploreDataLoading && !exploreError && exploreEmptyReason === 'no-interests' &&
                                        <DiscoveryStateMessage
                                            key="explore-no-interests"
                                            title="Add some interests to use this filter"
                                            subtitle="You haven't added any interests to your profile yet, so we can't find people who share them."
                                        />
                                    }

                                    {noSearchResults(profiles) === 0 && !exploreDataLoading && !exploreError && !exploreEmptyReason &&
                                        <motion.div key={`no-search-result`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='empty-state'>
                                            <img className="empty-state__icon" src="/assets/icons/like-empty-state.png" alt={``} />
                                            <div className='empty-state__text'>No Search Results</div>
                                        </motion.div>
                                    }

                                    {exploreDataLoading && noSearchResults(profiles) !== 0 &&
                                        <>
                                            {exploreDataLoading &&
                                                <motion.div key="explore-grid-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='explore-grid hidden md:grid'>
                                                    {[0, 1, 2, 3, 4].map((value, index) =>
                                                    (
                                                        <div key={index} className='explore-grid__column'>
                                                            {loadingData?.map((profile, index) => (
                                                                (index % 5 === value) &&
                                                                <Skeleton key={profile * index}
                                                                    containerClassName='explore-grid__profile'
                                                                    height={"100%"} />
                                                            ))}
                                                        </div>
                                                    )
                                                    )}
                                                </motion.div>
                                            }

                                            {exploreDataLoading && noSearchResults(profiles) !== 0 &&
                                                <motion.div key="mobile-grid-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='mobile-grid'>
                                                    {[0, 1, 2].map((value, index) =>
                                                    (
                                                        <div key={index} className='mobile-grid__column'>
                                                            {loadingData?.map((profile, index) => (
                                                                (index % 3 === value) &&
                                                                <Skeleton key={profile * index}
                                                                    containerClassName='explore-grid__profile'
                                                                    height={"100%"} />
                                                            ))}
                                                        </div>
                                                    )
                                                    )}
                                                </motion.div>}
                                        </>
                                    }

                                    {!exploreDataLoading && <>
                                        {!exploreDataLoading && noSearchResults(profiles) !== 0 &&
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="explore-grid" className='explore-grid hidden md:grid'>

                                                {[0, 1, 2, 3, 4].map((value, index) => (
                                                    <div key={index} className={`explore-grid__column`}>
                                                        {noSearchResult(profiles).map((profile, index: number) => (
                                                            (index % 5 === value) &&
                                                            <ExploreGridProfile
                                                                // @ts-expect-error optional created_at field
                                                                isNewUser={isNewUserFromDate(profile.created_at as string)}
                                                                profile_image={profile.photos ? profile.photos![0] : undefined}
                                                                first_name={profile!.first_name!}
                                                                age={calculateAge(profile.date_of_birth) ?? 0}
                                                                onProfileClick={() => {
                                                                    setSelectedProfile(profile?.uid as string)
                                                                }}
                                                                isVerified={profile!.is_approved as boolean}
                                                                hasBeenLiked={hasUserBeenLiked(profile.uid!)}
                                                                key={profile.uid}
                                                            />
                                                        ))}
                                                    </div>
                                                ))}

                                            </motion.div>
                                        }

                                        <motion.div key="mobile-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='mobile-grid'>

                                            {[0, 1, 2].map((value, i) => (
                                                <div key={i} className={`mobile-grid__column`}>
                                                    {noSearchResult(profiles).map((profile, index) => (
                                                        (index % 3 == value) &&
                                                        <ExploreGridProfile
                                                            key={`${index}-${profile.uid}`}
                                                            // @ts-expect-error optional created_at field
                                                            isNewUser={isNewUserFromDate(profile.created_at as string)}
                                                            // isNewUser={false}
                                                            profile_image={profile.photos ? profile.photos![0] : undefined}
                                                            first_name={profile!.first_name!}
                                                                age={calculateAge(profile.date_of_birth) ?? 0}
                                                            onProfileClick={() => setSelectedProfile(profile?.uid as string)}
                                                            isVerified={profile!.is_approved as boolean}
                                                            hasBeenLiked={hasUserBeenLiked(profile.uid!)}
                                                        />
                                                    ))}
                                                </div>
                                            ))}

                                        </motion.div>
                                    </>}
                                </AnimatePresence>
                                {!exploreDataLoading && hasMoreProfiles &&
                                    <div className="w-full flex justify-center py-[1.6rem]">
                                        <button
                                            onClick={() => loadMoreProfiles().catch((err) => console.error("An error occurred while trying to load more profiles: ", err))}
                                            disabled={loadingMoreProfiles}
                                            className="text-[1.4rem] font-medium text-[#485FE6] disabled:opacity-50"
                                        >
                                            {loadingMoreProfiles ? 'Loading…' : 'Load more'}
                                        </button>
                                    </div>
                                }
                            </div>
                        </div>
                    </DashboardPageContainer>
                }

                {advancedSearchShowing && <DashboardPageContainer className={`explore-page ${advancedSearchShowing && 'h-screen lg:h-auto'}`} span={1}>
                    <div className="settings-page__container">
                        <div className="settings-page__title">
                            <button onClick={() => {
                                setAdvancedSearchShowing(false);
                                if (selectedOption == 'Advanced Search') {
                                    fetchProfilesBasedOnOption().catch((err) => console.error("An error occurred while trying to fetch profiles: ", err))
                                }
                            }} className="settings-page__title__left">
                                <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``} />
                                <p>Advanced Search Preferences</p>
                            </button>
                            <button onClick={resetAdvancedSearch} className='self-center text-[#485FE6]'>{!resetLoading ? 'Reset' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>

                            {<GenderSettingsModal
                                showing={advancedSearchModalShowing === 'gender'}
                                hideModal={hideModal}
                                userGender={advancedSearchPreferences?.gender as string}
                                handleSave={async (gender) => await updateSearchPreferences({ gender })} />}

                            <AgeRangeModal
                                showing={advancedSearchModalShowing === 'age-range'}
                                hideModal={hideModal} min={advancedSearchPreferences.age_range?.min as number}
                                max={advancedSearchPreferences.age_range?.max as number}
                                handleSave={async (age_range) => await updateSearchPreferences({ age_range })} />

                            <CountrySettingsModal
                                showing={advancedSearchModalShowing === 'country'}
                                hideModal={hideModal}
                                preferredCountry={advancedSearchPreferences?.country as string}
                                handleSave={async (country) => await updateSearchPreferences({ country })} />

                            <RelationshipPreferenceSettingsModal
                                userPreference={advancedSearchPreferences.relationship_preference as number}
                                hideModal={hideModal} showing={advancedSearchModalShowing === 'relationship_preference'}
                                handleSave={async (relationship_preference) => await updateSearchPreferences({ relationship_preference })} />

                            <ReligionSettingsModal
                                userReligion={advancedSearchPreferences.religion as number}
                                showing={advancedSearchModalShowing == 'religion'}
                                hideModal={hideModal}
                                handleSave={async religion => await updateSearchPreferences({ religion })} />

                        </div>
                        <div className="px-5 pt-4">
                            <div className="flex justify-between">
                            </div>
                        </div>
                        <SettingsGroup data={settingsData
                            .filter(item => !(user?.meet !== 2 && item.label === 'Gender'))
                            .map(item => [item.label, item.value, item.onClick])} />
                    </div>
                </DashboardPageContainer>
                }
            </>
        }
        {selectedProfile &&
            <ViewProfile
                onBackClick={() => { setSelectedProfile(null) }}
                userData={profiles.find(profile => selectedProfile as string == profile.uid)!}
                onBlockChange={refreshProfiles}
            />}
    </>
}
export default Explore;