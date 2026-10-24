import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => {

    return <div>
        {/* A way back to the public site from every sign-in and sign-up
            screen, styled like the site's own header. */}
        <header className="fixed top-0 left-0 z-50 m-[20px] lg:m-[4rem]">
            <Link
                to="/"
                aria-label="Whossy home"
                className="flex items-center gap-[8px] bg-red text-white rounded-[8px] px-[12px] py-[10px] lg:px-[2rem] lg:py-[1.2rem] hover:brightness-110 active:scale-[0.98] transition-all"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="opacity-80">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <img src="/assets/icons/logo.svg" alt="" />
                <span className="text-[16px] lg:text-[1.6rem] font-black">whossy</span>
            </Link>
        </header>
        <Outlet />
    </div>
}
export default AuthLayout;
