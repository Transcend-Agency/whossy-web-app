import { useAuthStore } from "@/store/UserId";

// Where the public site's "Log in / Create account" buttons should lead.
// A visitor who is already signed in is offered the app instead, sent to
// the same place the route guards would send them (ProtectedRoute.tsx).
const useAccountEntry = () => {
  const { auth, user } = useAuthStore();
  const signedIn = !!(auth?.uid && user);
  const appPath = auth?.has_completed_onboarding ? "/dashboard/explore" : "/onboarding";
  return { signedIn, appPath };
};

export default useAccountEntry;
