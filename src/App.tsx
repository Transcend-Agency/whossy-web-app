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
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import OnboardingLayout from "./pages/OnboardingLayout";
import PhoneNumber from "./pages/PhoneNumber";
import { ProtectedDashboard } from "./pages/ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import Notification from "./pages/Notification";
import Faq from "./pages/Faq";
import Contact from "./pages/Contact";
import React, { useEffect } from "react";
import useDashboardStore from "@/store/useDashboardStore.tsx";
import useProfileFetcher from "@/hooks/useProfileFetcher.tsx";
import useAutoLogout, {useAuthStore} from "@/store/UserId.tsx";
import ViewProfile from "./components/dashboard/ViewProfile";
import { TourProvider } from '@reactour/tour'
import { CompletedTours } from "@/types/tourGuide.ts";
import { TourGuideModal } from "@/components/dashboard/TourGuideModal.tsx";
import { styles, tourGuideSteps } from "@/data/tour-guide-steps.ts";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import {updateUserProfile} from "@/hooks/useUser.ts";
import { User } from "@/types/user.ts";
import DeleteAccount from "./pages/DeleteAccount";
import { AdminRoute } from "./pages/AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import VerificationQueue from "./pages/admin/VerificationQueue";
import VerificationChallenges from "./pages/admin/VerificationChallenges";

const queryClient = new QueryClient();

function App() {
  const location = useLocation();
  useTrackUserPresence();
  useAutoLogout()

  const {
    profiles,
    selectedProfile,
    setSelectedProfile,
    blockedUsers,
    selectedOption,
    currentLocation,
    previousLocation,
    totalCurrentStep,
    setTotalCurrentStep
  } = useDashboardStore()
  const { fetchProfilesBasedOnOption, refreshProfiles } = useProfileFetcher()
  const { auth } = useAuthStore();

  useEffect(() => {
    fetchProfilesBasedOnOption().catch((err) => console.error("An error occurred while trying to fetch profiles: ", err))
  }, [selectedOption, blockedUsers]);

  useEffect(() => {
    // Scroll to the top of the page whenever the route changes
    window.scrollTo(0, 0);
  }, [location]);

  //
  useEffect(() => {
    setSelectedProfile(null); // Reset selectedProfile on route change
  }, [location.pathname]);

  const updateUser = async (s: User) => {
    updateUserProfile("users", auth?.uid as string, () => {}, s, false)
        .catch(err => console.error(err))
  }

  const handleClose = () => {
    const tourStepsData = tourGuideSteps
    const pageKeyValue = location.pathname.split('/')[2];
    const steps = tourStepsData[pageKeyValue] || []

    const pageKey = location.pathname;
    console.log(totalCurrentStep);

    updateUser({
      tour_guide: {
        [pageKey.split('/')[2]]: true // Assign a value (true in this case)
      }
    }).catch(e => console.log(e))

    if (totalCurrentStep === steps.length - 1) {
      const completedTours: CompletedTours = JSON.parse(
        localStorage.getItem("completedTourPages") || "{/dashboard/chat: true,}"
      );
      completedTours[pageKey] = true;
      localStorage.setItem("completedTourPages", JSON.stringify(completedTours));
      localStorage.removeItem("lastStep"); // Clear last step on completion
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TourProvider
        steps={[]}
        styles={styles}
        showNavigation={true} showBadge={true}
        showDots={false}
        padding={{
          mask: 8,
          // popover: [-20, 0, 0, -40],
          popover: location.pathname == "/dashboard/swipe-and-match" ? [0, 30, 0, 0] : [-20, 0, 0, -40],
          // popover: window.innerWidth < 1024 ? [20,0,0,10] : [-20, 0, 0, -40],
          wrapper: 0,
        }}
        position="right" // Ensure the popover respects this position
        prevButton={({ currentStep, setCurrentStep }) => (
          <button onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F2243E] disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
        )}
        onClickMask={({ setCurrentStep, currentStep, steps, setIsOpen }) => {
          if (steps) {
            if (currentStep === steps.length - 1) {
              handleClose();
              setIsOpen(false);
            }
            const nextStep = currentStep === steps.length - 1 ? 0 : currentStep + 1;
            localStorage.setItem("lastStep", nextStep.toString());
            setCurrentStep(nextStep);
          }
        }}
        onClickClose={({ setIsOpen, setCurrentStep, currentStep }) => {
          handleClose();
          setIsOpen(false);
          localStorage.setItem("lastStep", currentStep.toString()); // Save last step
          setCurrentStep(currentStep);
        }}
        nextButton={({ currentStep, stepsLength, setCurrentStep, setIsOpen }) => (
          <button
            onClick={() => {
              if (currentStep === stepsLength - 1) {
                handleClose();
                setIsOpen(false);
              } else {
                const nextStep = currentStep + 1;
                localStorage.setItem("lastStep", nextStep.toString()); // Save current step
                setCurrentStep(nextStep);
                setTotalCurrentStep(nextStep);
              }
            }}
            className="items-center gap-2 px-4 py-2 text-[12px] font-medium text-white bg-gradient-to-r from-[#F2243E] to-[#FB923C] rounded-full hover:from-[#E01E32] hover:to-[#F97316] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F2243E] cursor-pointer"
          >
            {currentStep === stepsLength - 1 ? "Finish" : "Next"}
          </button>
        )}
        disableInteraction={false}
      >
        {location.pathname.startsWith("/auth") && (<MarqueeImageSliderBackground />)}
        <AnimatePresence>
          <RouteWatcher key={`${currentLocation}_${previousLocation}`} />
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
            <Route path="/onboarding" element={<OnboardingLayout />}>
              <Route index element={<Onboarding />} />
            </Route>
            <Route path="/dashboard" element={
              <ProtectedDashboard>
                <DashboardLayout />
                <TourGuideModal />
              </ProtectedDashboard>}>
              <Route path="user-profile"
                     element={
                selectedProfile ?
                         <ViewProfile
                             onBackClick={() => { setSelectedProfile(null) }}
                             userData={profiles.find(profile => selectedProfile as string == profile.uid)!}
                             onBlockChange={refreshProfiles}
                         /> :
                    <UserProfile />
              } />
              {/*<Route path="explore" element={<Explore />} />*/}
              <Route path="explore" element={selectedProfile ? <ViewProfile
                onBackClick={() => { setSelectedProfile(null) }}
                userData={profiles.find(profile => selectedProfile as string == profile.uid)!}
                onBlockChange={refreshProfiles}
            /> : <Explore />} />
              {/*<Route path="swipe-and-match" element={<SwipingAndMatching />} />*/}

              <Route path="swipe-and-match" element={selectedProfile ? <ViewProfile
                onBackClick={() => { setSelectedProfile(null) }}
                userData={profiles.find(profile => selectedProfile as string == profile.uid)!}
                onBlockChange={refreshProfiles}
            /> : <SwipingAndMatching />} />

              <Route path="matches" element={selectedProfile ? <ViewProfile
                onBackClick={() => { setSelectedProfile(null) }}
                userData={profiles.find(profile => selectedProfile as string == profile.uid)!}
                onBlockChange={refreshProfiles}
              /> : <MatchesPage />} />
              <Route path="chat" element={selectedProfile ? <ViewProfile
                onBackClick={() => { setSelectedProfile(null) }}
                userData={profiles.find(profile => selectedProfile as string == profile.uid)!}
                onBlockChange={refreshProfiles}
              /> : <Chat />} />
              <Route path="notification" element={<Notification />} />
            </Route>
            <Route path="" element={<Landing />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="verifications" element={<VerificationQueue />} />
              <Route path="challenges" element={<VerificationChallenges />} />
            </Route>
          </Routes>
          <ToastContainer />
        </AnimatePresence>
      </TourProvider>
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

const RouteWatcher = () => {
  const location = useLocation()
  const { setLocation } = useDashboardStore()

  useEffect(() => {
    setLocation(location.pathname)
  }, [location, setLocation])

  return null
};