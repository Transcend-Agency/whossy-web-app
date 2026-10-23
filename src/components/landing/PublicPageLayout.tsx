import { useEffect, type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

// Shell for the public pages (FAQ, Contact, Privacy Policy, Delete Account).
// The page is at least one screen tall with the footer pinned to the bottom,
// so short pages never leave a blank strip under the footer. The header is
// fixed, so content starts below it.
const PublicPageLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  // The router keeps the previous page's scroll position; a new page should
  // open at its top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    // Respects the visitor's reduced-motion setting for every animation below.
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col min-h-screen min-h-[100dvh]">
        {/* Click-through outside the header itself, so the empty band beside
            it does not block the page scrolling underneath. Kept outside the
            animated content: the header stays put between pages, and a
            transform on an ancestor would break its fixed position. */}
        <div className="fixed top-0 w-full z-50 pointer-events-none">
          <Navbar />
        </div>

        {/* Each page fades and rises in as it opens. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col flex-grow"
        >
          <main className="flex-grow pt-[120px] lg:pt-[14rem]">{children}</main>

          <Footer />
        </motion.div>
      </div>
    </MotionConfig>
  );
};

export default PublicPageLayout;
