import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { pressable } from '@/utils/pressable';

// Pages reachable from the public site's header. The footer links to these
// too, plus the legal pages.
const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact Us" },
];

const MOBILE_MENU_ID = "mobile-menu";

const Navbar = () => {
  const [mobileNav, setMobileNav] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const closeMobileNav = () => setMobileNav(false);

  // Close on navigation, so following a link never leaves the menu covering
  // the page it opened.
  useEffect(() => {
    setMobileNav(false);
  }, [pathname]);

  // While open: Escape closes, the page behind does not scroll, and the menu
  // closes by itself if the window grows past the mobile breakpoint.
  useEffect(() => {
    if (!mobileNav) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNav(false);
        buttonRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileNav(false);
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [mobileNav]);

  const handleLogoClick = () => {
    closeMobileNav();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* MOBILE MENU — sits under the header, so the toggle stays visible and
          doubles as the close button. */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div
            id={MOBILE_MENU_ID}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="lg:hidden pointer-events-auto fixed inset-0 z-40 bg-white text-black flex flex-col overflow-y-auto pt-[120px] pb-[32px] px-[28px]"
          >
            <nav aria-label="Main" className="flex flex-col items-start">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={closeMobileNav}
                  className={({ isActive }) =>
                    `w-full py-[16px] text-[24px] uppercase border-b border-solid border-lightgray transition-colors ${isActive ? "text-red" : "text-black active:text-red"}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="flex flex-col gap-[12px] mt-[32px]">
              <button
                onClick={() => navigate("/auth/login")}
                className="w-full rounded-[8px] border border-solid border-red text-red text-[16px] font-medium py-[14px] active:scale-[0.98] transition-transform"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/auth/create-account")}
                className="w-full rounded-[8px] bg-red text-white text-[16px] font-medium py-[14px] active:scale-[0.98] transition-transform"
              >
                Create account
              </button>
            </div>

            <div className="mt-auto pt-[32px] flex gap-[12px]">
              <a href="#app-store" onClick={closeMobileNav}>
                <img src={'/assets/icons/AppleStore.svg'} alt="Download on the App Store" />
              </a>
              <a href="#play-store" onClick={closeMobileNav}>
                <img src={'/assets/icons/Play-Store.svg'} alt="Get it on Google Play" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE HEADER */}
      <header className="pointer-events-auto absolute top-0 z-50 lg:hidden bg-red text-white rounded-[8px] m-[28px] overflow-hidden">
        <div className="flex items-center justify-between py-[12px] px-[12px]">
          <div {...pressable(handleLogoClick)} className="flex items-center mr-[48px] min-[400px]:mr-[80px]" aria-label="Whossy home">
            <img src={"/assets/icons/logo.svg"} alt="" className="mr-[8px]" />
            <p className="text-[16px] font-black">whossy</p>
          </div>
          <div className="h-[20px]" style={{ borderLeft: '1px solid #FFFFFF' }} />
          <motion.button
            type="button"
            animate={mobileNav ? "open" : "closed"}
            ref={buttonRef}
            onClick={() => setMobileNav((open) => !open)}
            aria-label={mobileNav ? "Close menu" : "Open menu"}
            aria-expanded={mobileNav}
            aria-controls={MOBILE_MENU_ID}
            className="flex flex-col space-y-[6px] px-[16px] py-[6px]"
          >
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: 45, y: 8 },
              }}
              className="w-[28px] h-[2px] bg-white"
            ></motion.span>
            <motion.span
              variants={{
                closed: { opacity: 1 },
                open: { opacity: 0 },
              }}
              className="w-[28px] h-[2px] bg-white"
            ></motion.span>
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: -45, y: -8 },
              }}
              className="w-[28px] h-[2px] bg-white"
            ></motion.span>
          </motion.button>
        </div>
      </header>

      {/* DESKTOP HEADER */}
      <header className="pointer-events-auto relative z-50 bg-red text-white w-fit m-[4rem] rounded-[0.8rem] hidden lg:block">
        <div className="flex items-center gap-[2.4rem] py-[1.2rem] px-[2.4rem]">
          <div {...pressable(handleLogoClick)} className="flex items-center" aria-label="Whossy home">
            <img src={"/assets/icons/logo.svg"} alt="" className="mr-[0.8rem]" />
            <p className="text-[1.6rem] font-black">whossy</p>
          </div>

          <div className="h-[2.4rem]" style={{ borderLeft: '1px solid #FFFFFF' }} />

          <nav aria-label="Main" className="flex items-center gap-[2.4rem] text-[1.6rem]">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `underline-offset-[0.6rem] decoration-2 transition-opacity ${isActive ? "underline" : "opacity-80 hover:opacity-100"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="h-[2.4rem]" style={{ borderLeft: '1px solid #FFFFFF' }} />

          <div className="flex items-center text-[1.6rem] space-x-[1.6rem]">
            <p>Download on</p>
            <a href="#ios-download" aria-label="Download on the App Store">
              <img src={'/assets/icons/apple.svg'} alt="" />
            </a>
            <a href="#android-download" aria-label="Get it on Google Play">
              <img src={'/assets/icons/playstore.svg'} alt="" />
            </a>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
