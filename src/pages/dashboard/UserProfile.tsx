import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import DashboardPageContainer from '../../components/dashboard/DashboardPageContainer';
import ProfileCreditButtton from '../../components/dashboard/ProfileCreditButtton';
import ProfilePlan from '../../components/dashboard/ProfilePlan';
import EditProfile from './EditProfile';
import PreviewProfile from './PreviewProfile';
import ProfileSettings from './ProfileSettings';
// import MobileProfile from '../MobileProfile';
// import EditProfileMobile from '../EditProfileMobile';
import { getUserProfile } from '@/hooks/useUser';
import { User, UserFilters } from '@/types/user';
// import PreviewProfileMobile from '../PreviewProfileMobile';
import Preferences from './Preferences';
import SafetyGuide from './SafetyGuide';
// import Interests from './Interests';
// import SettingsMobile from '../SettingsMobile';
// import PreferencesMobile from '../PreferencesMobile';

import { useAuthStore } from '@/store/UserId';
import PreferredInterestsDesktop from './PreferredInterestsDesktop';
// import PreferredInterestsMobile from './PreferredInterestsMobile';
import UserInterestsDesktop from './UserInterestsDesktop';
import { getYearFromFirebaseDate } from '@/utils/date';
import SubscriptionPlans from './SubscriptionPlans';
import Skeleton from 'react-loading-skeleton';
import Circle from '@/components/dashboard/Circle';
import { checkUserProfileCompletion } from '@/constants';


// type UserProfileProps = {};


const UserProfile = () => {
    const [activePage, setActivePage] = useState<'user-profile' | 'edit-profile' | 'profile-settings' | 'preferences' | 'safety-guide' | 'interests' | 'user-interests' | 'subscription-plans'>('user-profile');
    const [activeSubPage, setActiveSubPage] = useState(0);
    const [userData, setUserData] = useState<User>();
    const [userFilters, setUserFilters] = useState<UserFilters>();
    const [currentPlan, setCurrentPlan] = useState<'free' | 'premium'>('free');
    const [completed, setCompleted] = useState<number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const {auth} = useAuthStore();

    const fetchUserData = async () => { 
        const data = await getUserProfile("users", auth?.uid as string) as User; 
        setUserData(data);
        setCompleted(checkUserProfileCompletion(data))
    }
    
    const fetchUserFilters = async () => {const data = await getUserProfile("filters", auth?.uid as string) as UserFilters; setUserFilters(data) }

    // useEffect(() => {fetchUser(); fetchUserPreferences()}, [userData, userPrefencesData])
    useEffect(() => { fetchUserData(); fetchUserFilters()}, [] )


    const refetchUserData = async () => { await fetchUserData() }
    const refetchUserFilters = async () => { await fetchUserFilters() }

    return <>
        <DashboardPageContainer>
            <motion.div animate={activePage == 'user-profile' ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }} transition={{ duration: 0.25 }} className='user-profile h-full'>
                <div className='user-profile__container flex flex-col'>
                    <div className='flex justify-end gap-x-4'>
                        <button onClick={() => setActivePage('profile-settings')} className='user-profile__settings-button'><img src="/assets/images/dashboard/settings.svg" /></button>
                        <button onClick={() => setActivePage('preferences')} className='user-profile__settings-button'><img src="/assets/icons/control.svg" /></button>
                    </div>
                    <div className='self-center relative'>
                        <Circle percentage={completed ? Math.ceil(completed / 19 * 100) : 0} imageUrl={userData?.photos && Array.isArray(userData.photos) && userData.photos.length > 0 ? userData.photos[0] : '/assets/images/auth-bg/1.webp'}/>
                        <button onClick={() => { setActivePage('edit-profile'); setActiveSubPage(0) }} className='user-profile__update-profile-button '>
                            <img src="/assets/icons/update-profile.svg" />
                        </button>
                    </div>
                    {/* <section className='user-profile__profile-picture-container'>
                    </section> */}
                    <section className='user-profile__profile-details'>
                        <div className='user-profile__profile-details flex justify-center mt-2'>
                            {userData ? <p>{userData?.first_name}, <span className='user-profile__profile-details__age'>{userData?.date_of_birth ? (new Date()).getFullYear() - getYearFromFirebaseDate(userData.date_of_birth) : 'NIL'}</span>
                                <img src="/assets/icons/verified-badge.svg" />
                            </p> : <Skeleton width='21rem' height='2.9rem' />}
                        </div>
                       {completed ?  
                       <div className='user-profile__profile-details__completion-status'>
                            {Math.ceil(completed / 19 * 100)}% Complete 
                        </div> : 
                        <div className='mt-[1.2rem] flex justify-center'>
                            <Skeleton width='14rem' height='3.3rem' />
                        </div>}
                    </section>
                    <div className='user-profile__banner user-profile__banner--info'>
                        <img src="/assets/icons/notification-alert.svg" />
                        <p>Add more info to your profile to stand out. Click on the edit button to get started.</p>
                    </div>
                    <div onClick={() => setActivePage('safety-guide')} className='user-profile__banner user-profile__banner--safety-guide'>
                        <img src="/assets/icons/safety-guide.svg" />
                        <p>Whossy Safety Guide</p>
                    </div>
                    <section className='user-profile__credit-buttons'>
                        <ProfileCreditButtton description='Profile Boost' linkText='Get Now' imgSrc='/assets/images/dashboard/rocket.png' onLinkClick={() => { }} />
                        <ProfileCreditButtton description='Add Credits' linkText='Add More' imgSrc='/assets/images/dashboard/coin.png' onLinkClick={() => { }} />
                    </section>

                </div>
                <section className='user-profile__plans'>
                    <ProfilePlan planTitle='Whossy Free Plan' pricePerMonth='0' benefits={['Profile Browsing', 'Swipe And Match', 'See Who Likes You', 'Profile Boost']} type='free' gradientSrc='/assets/images/dashboard/free.svg' goToPlansPage={() => {setActivePage('subscription-plans'); setCurrentPlan('free')}}/>
                    <ProfilePlan planTitle='Whossy Premium Plan' pricePerMonth='12.99' benefits={['Chat Initiation', 'Rewind', 'Top Picks', 'Read Receipts']} type='premium' gradientSrc='/assets/images/dashboard/premium.svg' goToPlansPage={() =>{ setActivePage('subscription-plans'); setCurrentPlan('premium')}}/>
                </section>

            </motion.div>
            <EditProfile activePage={activePage} activeSubPage={activeSubPage} closePage={() => setActivePage('user-profile')} onPreviewProfile={() => { setActivePage('edit-profile'); setActiveSubPage(1) }} setActiveSubPage={setActiveSubPage} onInterests={() => setActivePage('user-interests')} userData={userData} refetchUserData={refetchUserData} />
            <SafetyGuide activePage={activePage} activeSubPage={activeSubPage} closePage={() => setActivePage('user-profile')} onSafetyItem={() => { setActivePage('safety-guide'); setActiveSubPage(1) }} setActiveSubPage={setActiveSubPage} />
            <ProfileSettings activePage={activePage == 'profile-settings'} closePage={() => setActivePage('user-profile')} userSettings={{incoming_messages: userData?.incoming_messages, public_search: userData?.public_search, online_status: userData?.status?.online, read_receipts: userData?.read_receipts, hide_verification_badge: userData?.hide_verification_badge}} refetchUserData={refetchUserData}/>
            <Preferences activePage={activePage == 'preferences'} closePage={() => setActivePage('user-profile')} onInterests={() => setActivePage('interests')} userData={userData} userFilters={userFilters} refetchUserData={refetchUserData} refetchUserFilters={refetchUserFilters} />
            <PreviewProfile activePage={activePage} activeSubPage={activeSubPage} closePage={() => { setActivePage('edit-profile'); setActiveSubPage(0) }} setActiveSubPage={setActiveSubPage} userData={userData} />
            {/* <Interests activePage={activePage === "interests"} closePage={() => setActivePage('preferences')} /> */}
            <PreferredInterestsDesktop activePage={activePage == 'interests'} closePage={() => setActivePage('preferences')} onInterests={() => setActivePage('interests')} userFilters={userFilters} refetchUserFilters={refetchUserFilters} />
            <UserInterestsDesktop activePage={activePage == 'user-interests'} closePage={() => setActivePage('edit-profile')} onInterests={() => setActivePage('interests')} userData={userData} refetchUserData={refetchUserData} />
            <SubscriptionPlans currentPlan={currentPlan} activePage={activePage == 'subscription-plans'} closePage={() => setActivePage('user-profile')} />
        </DashboardPageContainer >
        {/* <AnimatePresence mode="wait">
        <MobileProfile onEditProfilePage={() => setActivePage('edit-profile')} activePage='user-profile' onSettingsPage={() => setActivePage('profile-settings')} onFiltersPage={() => setActivePage('preferences')} />
        <EditProfileMobile activePage={activePage} closePage={() => setActivePage('user-profile')} onPreviewProfile={() => setActivePage('preview-profile')} />
        <PreviewProfileMobile activePage={activePage == 'preview-profile'} closePage={() => setActivePage('edit-profile')} />
        <SettingsMobile activePage={activePage == 'profile-settings'} closePage={() => setActivePage('user-profile')} />
        <PreferencesMobile activePage={activePage == 'preferences'} closePage={() => setActivePage('user-profile')} onInterests={() => setActivePage("interests")} />
        <Interests activePage={activePage === "interests"} closePage={() => setActivePage('preferences')} />
    </AnimatePresence> */}
        {/* <EditProfile activePage={activePage} closePage={() => setActivePage('user-profile')} onPreviewProfile={() => setActivePage('preview-profile')} onInterests={() => setActivePage('user-interests')}  userData={userData} userPrefencesData={userPrefencesData} refetchUserData={refetchUserData} refetchUserPreferencesData={refetchUserPreferences} />
            <ProfileSettings activePage={activePage == 'profile-settings'} closePage={() => setActivePage('user-profile')} />
            <PreviewProfile activePage={activePage == 'preview-profile'} closePage={() => setActivePage('edit-profile')} userData={userData} userPrefencesData={userPrefencesData}/>
            <Preferences activePage={activePage == 'preferences'} closePage={() => setActivePage('user-profile')} onInterests={() => setActivePage('interests')} userData={userData} userPrefencesData={userFilters} refetchUserData={refetchUserData} refetchUserPreferencesData={refetchUserFilters}/>
            <PreferredInterestsDesktop activePage={activePage == 'interests'} closePage={() => setActivePage('preferences')} onInterests={() => setActivePage('interests')} userPrefencesData={userFilters} refetchUserPreferencesData={refetchUserFilters}/>
            <UserInterestsDesktop activePage={activePage == 'user-interests'} closePage={() => setActivePage('edit-profile')} onInterests={() => setActivePage('interests')} userPrefencesData={userPrefencesData} refetchUserPreferencesData={refetchUserPreferences}/>
            <SubscriptionPlans currentPlan={currentPlan} activePage={activePage == 'subscription-plans'} closePage={() => setActivePage('user-profile')} />
            {/* <Interests activePage={activePage === "interests"} closePage={() => setActivePage('preferences')} /> */}
        {/* <AnimatePresence mode="wait"> */}
        {/* <MobileProfile onEditProfilePage={() => setActivePage('edit-profile')} activePage='user-profile' onSettingsPage={() => setActivePage('profile-settings')} onFiltersPage={() => setActivePage('preferences')} userData={userData} userPrefencesData={userPrefencesData}/> */}
        {/* <EditProfileMobile  activePage={activePage} closePage={() => setActivePage('user-profile')} onPreviewProfile={() => setActivePage('preview-profile')} userData={userData} userPrefencesData={userPrefencesData} refetchUserData={refetchUserData} refetchUserPreferencesData={refetchUserPreferences}/> 
            <PreviewProfileMobile  activePage={activePage == 'preview-profile'} closePage={() => setActivePage('edit-profile')} userData={userData} userPrefencesData={userPrefencesData}/> 
            <SettingsMobile activePage={activePage == 'profile-settings'} closePage={() => setActivePage('user-profile')}/>
            <PreferencesMobile activePage={activePage == 'preferences'} closePage={() => setActivePage('user-profile')} onInterests={() => setActivePage("interests")} userData={userData} userPrefencesData={userFilters} refetchUserData={refetchUserData} refetchUserPreferencesData={refetchUserFilters}/>
            <PreferredInterestsMobile activePage={activePage == 'interests'} closePage={() => setActivePage('preferences')} onInterests={() => setActivePage('interests')} userPrefencesData={userFilters} refetchUserPreferencesData={refetchUserFilters}/> */}

        {/* <Interests activePage={activePage === "interests"} closePage={() => setActivePage('preferences')} /> */}

        {/* </AnimatePresence> */}
    </>
}
export default UserProfile;