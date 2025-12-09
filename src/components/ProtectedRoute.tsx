import { Navigate } from 'react-router-dom';
import { useAuth, roleRedirects } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { LoadingState } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isInitializing } = useAuth();

  // Wait for auth initialization before checking authentication
  if (isInitializing) {
    return <LoadingState message="Loading..." fullScreen />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed
  if (!user.role || !allowedRoles.includes(user.role)) {
    console.warn(`User role '${user.role}' not in allowed roles:`, allowedRoles);
    // Redirect to the user's correct dashboard instead of forbidden page
    const correctDashboard = roleRedirects[user.role as UserRole];
    if (correctDashboard) {
      console.log(`Redirecting ${user.role} to correct dashboard:`, correctDashboard);
      return <Navigate to={correctDashboard} replace />;
    }
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
