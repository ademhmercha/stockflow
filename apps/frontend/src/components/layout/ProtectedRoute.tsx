import { Navigate } from "react-router-dom";
import { useAuthStore, hasRole } from "@/stores/auth.store";
import { Role } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Role[];
  requirePlatformOwner?: boolean;
}

export function ProtectedRoute({ children, roles, requirePlatformOwner }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(user.role, ...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  // isPlatformOwner est une dimension distincte du rôle applicatif (admin/
  // vendeur/comptable) : un propriétaire de plateforme reste "admin" au sein
  // de sa propre entreprise technique, ce n'est pas un rôle parmi d'autres.
  if (requirePlatformOwner && !user.isPlatformOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
