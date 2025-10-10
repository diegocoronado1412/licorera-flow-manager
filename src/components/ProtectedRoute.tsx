import React from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated } = useSession();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
