import { useAuthStore } from "@/store/UserId";
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { auth, user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!auth?.uid) {
      setIsAdmin(false);
      return;
    }

    getDoc(doc(db, "admins", auth.uid))
      .then((snap) => setIsAdmin(snap.exists()))
      .catch((err) => {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      });
  }, [auth?.uid]);

  if (!auth?.uid || !user) return <Navigate to="/auth" />;
  if (isAdmin === null) return <p>Loading...</p>;
  return isAdmin ? children : <Navigate to="/dashboard/explore" />;
};
