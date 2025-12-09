import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';
import { api } from '@/api';

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<{ success: boolean; user?: User }>;
  logout: () => void;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize auth state on mount - restore from stored token or require login
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Mark initialization in progress
        sessionStorage.setItem('auth-initializing', 'true');
        
        // Check if we have a stored token from previous login
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedToken) {
          console.log('🔐 Token found in localStorage, attempting to restore session');
          
          // Try to fetch current user with stored token
          try {
            const response = await api.auth.getCurrentUser();
            if (response.data?.user) {
              // Successfully restored session
              setAuthState({
                user: response.data.user,
                token: storedToken,
                isAuthenticated: true,
              });
              console.log('✅ Session restored successfully for user:', response.data.user.name);
              return;
            }
          } catch (err) {
            // Token is invalid or expired, clear it
            console.warn('⚠️ Stored token is invalid, clearing and requiring login');
            localStorage.removeItem('auth_token');
          }
        }
        
        // No valid token or session restore failed - user must login
        console.log('ℹ️ Auth initialized - user not authenticated');
        
      } catch (err: unknown) {
        console.error('❌ Auth initialization error:', (err as Error).message);
        localStorage.removeItem('auth_token');
      } finally {
        // Clear initialization flag and complete initialization
        sessionStorage.removeItem('auth-initializing');
        console.log('✓ Auth initialization complete');
        // Add a small delay to ensure auth state is fully committed before rendering
        setTimeout(() => {
          setIsInitializing(false);
        }, 100);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const response = await api.auth.login(identifier, password);
      const { user, token } = response.data;

      // Store JWT token in localStorage as fallback (for Authorization header)
      if (token) {
        localStorage.setItem('auth_token', token);
        console.log('💾 Token stored in localStorage');
      }

      // JWT is automatically stored in httpOnly cookie by axios/backend
      // We only store minimal user info in state, not the token
      setAuthState({
        user,
        token, // Backend returns token, but httpOnly cookie is primary
        isAuthenticated: true,
      });
      console.log('✅ Login successful: JWT token set in httpOnly cookie and localStorage');
      return { success: true, user };
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      
      // Check if user is detained
      if (err.response?.data?.isDetained) {
        throw err; // Pass the full error with detention details to Login component
      }
      
      return { success: false, error: err };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout API to clear httpOnly cookie on backend
      await api.auth.logout();
      console.log('✅ Logout successful: JWT cookie cleared on backend');
    } catch (err) {
      console.error('⚠️ Logout API error:', err);
      // Continue with logout even if API call fails
    } finally {
      // Always clear frontend state and localStorage
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth-initializing');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
      });
      console.log('💾 Local auth state cleared - user logged out');
      
      // Redirect to login
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const roleRedirects: Record<UserRole, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  hod: '/hod/dashboard',
  admin: '/admin/dashboard',
  principal: '/principal/dashboard',
};
