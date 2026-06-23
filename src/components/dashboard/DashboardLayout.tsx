import { db } from '@/firebase';
import { useAuthStore } from '@/store/UserId';
import {collection, getDocs } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { IoIosNotifications } from "react-icons/io";
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ChatInterface from './ChatInterface';
import DashboardNavIcon from './DashboardNavIcon';
import ShortcutControls from './ShortcutControls';
import MatchesSide from "@/components/dashboard/MatchesSide.tsx";

type Notification = {
    id: string;
    likedId: string;
    likerId: string;
    likerName: string;
    likerProfilePicture: string;
    seen: boolean;
    timestamp: string;
    title: string;
};

const Dashboard: React.FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [unseenNotificationsCount, setUnseenNotificationsCount] = useState(0);
    const { auth } = useAuthStore();

    useEffect(() => {
        fetchNotifications()
    }, []);

    const fetchNotifications = async () => {
        if (!auth?.uid) {
            console.error("User is not authenticated");
            return;
        }
        const notificationsRef = collection(db, `users/${auth.uid}/notifications`);
        try {
            const querySnapshot = await getDocs(notificationsRef);
            const notifications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];
            const unreadNotifications = notifications.filter(notifications => notifications.seen == false).length
            setUnseenNotificationsCount(unreadNotifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    return <>
        <div className='dashboard-layout hidden lg:block'>
            <ChatInterface />
            <AnimatePresence>
                {pathname == '/dashboard/swipe-and-match' && <ShortcutControls />}
            </AnimatePresence>
            <nav className='dashboard-layout__top-nav'>
                <div className='dashboard-layout__top-nav__container'>
                    <div className='dashboard-layout__top-nav__logo cursor-pointer hidden lg:block'
                         onClick={() => navigate('/dashboard/explore')}>
                        <img src={'/assets/icons/whossy-logo.svg'} alt="Logo" className='w-[10rem]' />
                    </div>
                    <div className='dashboard-layout__top-nav__icons-container items-center'>
                        <DashboardNavIcon active={pathname === '/dashboard/explore'} icon='explore' />
                        <DashboardNavIcon active={pathname === '/dashboard/swipe-and-match'} icon='swipe-and-match' />
                        <DashboardNavIcon active={pathname === '/dashboard/matches'} icon='matches' />
                        <DashboardNavIcon active={pathname === '/dashboard/chat'} icon='chat' />
                        <DashboardNavIcon active={pathname === '/dashboard/user-profile'} icon='user-profile' />
                    </div>
                    <div className='dashboard-layout__top-nav__control-icons-container relative nav-notification' onClick={() => navigate('/dashboard/notification')}>
                        <IoIosNotifications className={`size-[2.8rem] hover:scale-[1.02] active:scale-[0.95] cursor-pointer ${pathname === '/dashboard/notification' ? 'text-[#F2243E]' : 'text-[#8A8A8E]'}`} />
                        {unseenNotificationsCount > 0 &&
                            <div className='bg-[#ff0000]/70 absolute font-medium size-[1.6rem] text-[1.3rem] rounded-full right-[1px] text-white'>
                                <p className={`text-center pt-[1.2px]`}>{unseenNotificationsCount}</p>
                            </div>}
                    </div>
                </div>
            </nav>
            <main className='dashboard-layout__main-app'>
                <MatchesSide />
                <Outlet/>
            </main>
        </div>
        <div className="h-screen flex flex-col lg:hidden">
            <Outlet />
            <div className='dashboard-layout__mobile-nav'>
                <DashboardNavIcon active={pathname === '/dashboard/explore'} icon='explore' />
                <DashboardNavIcon active={pathname === '/dashboard/swipe-and-match'} icon='swipe-and-match' />
                <DashboardNavIcon active={pathname === '/dashboard/matches'} icon='matches' />
                <DashboardNavIcon active={pathname === '/dashboard/chat'} icon='chat' />
                <DashboardNavIcon active={pathname === '/dashboard/user-profile'} icon='user-profile' />
            </div>
        </div>
    </>
};
export default Dashboard;