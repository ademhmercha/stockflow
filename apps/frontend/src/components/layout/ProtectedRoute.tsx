import { Navigate } from "react-router-dom";
import { useAuthStore, hasRole } from "@/stores/auth.store";
import { Role } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Role[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(user.role, ...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
