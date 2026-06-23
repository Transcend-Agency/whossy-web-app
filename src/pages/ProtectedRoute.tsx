import { useAuthStore } from "@/store/UserId";
import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRoutesProps {
  children: React.ReactNode;
}

export const ProtectedDashboard: React.FC<ProtectedRoutesProps> = ({ children }) => {
  const { auth, user } = useAuthStore();

  if (!auth?.uid || !user) return <Navigate to="/auth" />;
  return auth.has_completed_onboarding ? children : <Navigate to="/onboarding" />;
};

export const ProtectedOnboarding: React.FC<ProtectedRoutesProps> = ({ children }) => {
  const { auth, user } = useAuthStore();

  if (!auth?.uid || !user) return <Navigate to="/auth" />;
  return auth.has_completed_onboarding ? <Navigate to="/dashboard/explore" /> : children;
};
