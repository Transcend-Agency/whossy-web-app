import React, { useEffect, useState } from 'react';
import DashboardNavIcon from './DashboardNavIcon';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Matches from './MatchesSide';
import ChatInterface from './ChatInterface';
import ShortcutControls from './ShortcutControls';
import { AnimatePresence } from 'framer-motion';
import { IoIosNotifications } from "react-icons/io";

const Dashboard: React.FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [newNotification, setNewNotification] = useState(false);

    useEffect(() => {
        if (pathname === '/dashboard/notification') {
            setNewNotification(true);
        }
        return () => {
            setNewNotification(false);
        }
    }, [pathname])
    // console.log(pathname)
    return <>
        <div className='dashboard-layout hidden lg:block'>
            <ChatInterface />
            <AnimatePresence>
                {pathname == '/dashboard/swipe-and-match' && <ShortcutControls />}
            </AnimatePresence>
            <nav className='dashboard-layout__top-nav'>
                <div className='dashboard-layout__top-nav__container'>
                    <div className='dashboard-layout__top-nav__logo hidden lg:block'>
                    <img src={'/assets/icons/whossy-logo.svg'} alt="Logo" className='dashboard-layout__top-nav__control-icon' />
    
                    </div>
                    <div className='dashboard-layout__top-nav__icons-container items-center'>
                        <DashboardNavIcon active={pathname === '/dashboard/swipe-and-match'} icon='swipe-and-match' />
                        <DashboardNavIcon active={pathname === '/dashboard/explore'} icon='explore' />
                        <DashboardNavIcon active={pathname === '/dashboard/matches'} icon='matches' />
                        <DashboardNavIcon active={pathname === '/dashboard/chat'} icon='chat' />
                        <DashboardNavIcon active={pathname === '/dashboard/user-profile'} icon='user-profile' />
                    </div>
                    <div className='dashboard-layout__top-nav__control-icons-container relative' onClick={() => navigate('/dashboard/notification')}>
                        {/* <img className='dashboard-layout__top-nav__control-icon  hidden lg:block ' src='/assets/icons/notification.svg' /> */}
                        <IoIosNotifications className={`size-[2.8rem] hover:scale-[1.02] active:scale-[0.95] cursor-pointer ${pathname === '/dashboard/notification' ? 'text-[#F2243E]' : 'text-[#8A8A8E]'}`} />
                        {!newNotification && <div className='bg-red-700 absolute size-[0.8rem] rounded-full right-[1px] '/>}
                        {/* <img className='dashboard-layout__top-nav__control-icon' src='/assets/icons/control.svg' /> */}
                    </div>
                </div>
            </nav>
            <main className='dashboard-layout__main-app'>
                <Matches />
                <Outlet />
            </main>
        </div>
        <div className="h-screen flex flex-col lg:hidden">
            <Outlet />
            <div className='dashboard-layout__mobile-nav'>
                <DashboardNavIcon active={pathname === '/dashboard/swipe-and-match'} icon='swipe-and-match' />
                <DashboardNavIcon active={pathname === '/dashboard/explore'} icon='explore' />
                <DashboardNavIcon active={pathname === '/dashboard/matches'} icon='matches' />
                <DashboardNavIcon active={pathname === '/dashboard/chat'} icon='chat' />
                <DashboardNavIcon active={pathname === '/dashboard/user-profile'} icon='user-profile' />
            </div>
        </div>
    </>
};
export default Dashboard;