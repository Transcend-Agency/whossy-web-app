import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { Route, Routes, useLocation } from "react-router-dom";
import EmailVerification from "./components/auth/EmailVerification";
import FinalizeSetup from "./components/auth/FinalizeSetup";
import MarqueeImageSliderBackground from "./components/auth/MarqueeImageSliderBackground";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import MatchesPage from "./components/dashboard/MatchesPage";
import useTrackUserPresence from "./hooks/useTrackUserPresesnce";
import "./index.scss";
import AccountSetup from "./pages/AccountSetup";
import AuthLayout from "./pages/AuthLayout";
import Chat from "./pages/Chat";
import CreateAccount from "./pages/CreateAccount";
import Explore from "./pages/dashboard/Explore";
import SwipingAndMatching from "./pages/dashboard/SwipingAndMatching";
import UserProfile from "./pages/dashboard/UserProfile";
import Favorites from "./pages/Favorites";
import ForgotPassword from "./pages/ForgotPassword";
import GlobalSearch from "./pages/GlobalSearch";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import OnboardingLayout from "./pages/OnboardingLayout";
import PhoneNumber from "./pages/PhoneNumber";
import { ProtectedDashboard, ProtectedOnboarding } from "./pages/ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import Notification from "./pages/Notification";
import Faq from "./pages/Faq";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

function App() {
  const location = useLocation();
  useTrackUserPresence();
  return (
    <QueryClientProvider client={queryClient}>
      { location.pathname.startsWith("/auth") && ( <MarqueeImageSliderBackground />) }
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="create-account" element={<CreateAccount />} />
            <Route path="account-setup" element={<AccountSetup />} />
            <Route path="phone-number" element={<PhoneNumber />} />
            <Route path="finalize-setup" element={<FinalizeSetup />} />
            <Route path="email-verification" element={<EmailVerification />} />
          </Route>
          <Route path="/onboarding" element={<ProtectedOnboarding><OnboardingLayout /></ProtectedOnboarding>}>
            <Route index element={<Onboarding />} />
          </Route>
          {/* <Route path="/dashboard" element={<DashboardLayout />}> */}
          <Route path="/dashboard" element={<ProtectedDashboard><DashboardLayout /></ProtectedDashboard>}>
            <Route path="user-profile" element={<UserProfile />} />
            <Route path="explore" element={<Explore />} />
            <Route path="swipe-and-match" element={<SwipingAndMatching />} />
            <Route path="matches" element={<MatchesPage />} />
            {/* <Route index element={<Matching />} /> */}
            <Route path="globalSearch" element={<GlobalSearch />} />
            <Route path="heart" element={<Favorites />} />
            <Route path="chat" element={<Chat />} />
            <Route path="notification" element={<Notification />} />
            {/* <Route path="settings" element={<Settings />} /> */}
            {/* <Route path="profile/preferences" element={<Preferences />} /> */}
            {/* <Route path="profile/edit" element={<EditProfile />} /> */}
          </Route>
          <Route path="" element={<Landing />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <ToastContainer />
      </AnimatePresence>
    </QueryClientProvider>
  );
}

export default App;

const ToastContainer: React.FC = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          maxWidth: "1000px",
          fontSize: "1.6rem",
        },
        duration: 1500,
      }}
    />
  );
};
