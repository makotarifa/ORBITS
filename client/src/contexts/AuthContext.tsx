import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { authService } from '../services/auth/auth.service';

// Define User interface locally since it's not in auth types
interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  experience: number;
  isActive: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app start
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        if (token && !authService.isTokenExpired(token)) {
          // Try to get user info from token
          const userInfo = authService.getCurrentUser();
          if (userInfo) {
            // For now, we'll need to fetch full user data from API
            // This is a placeholder - in a real app you'd have an endpoint to get current user
            setUser({
              id: userInfo.id,
              username: userInfo.username,
              email: '', // Would need to fetch from API
              level: 1,
              experience: 0,
              isActive: true,
              createdAt: new Date()
            });
          } else {
            // Token exists but invalid, clear it
            authService.clearTokens();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login({ emailOrUsername, password });

      if (response.success && response.data?.user && response.data?.access_token) {
        setUser(response.data.user);
        authService.setTokens(response.data.access_token, response.data.refresh_token);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.clearTokens();
    setUser(null);
  };

  const register = async (email: string, username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.register({ email, username, password });

      if (response.success && response.data?.user && response.data?.access_token) {
        setUser(response.data.user);
        authService.setTokens(response.data.access_token, response.data.refresh_token);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const token = authService.getToken();
      if (token) {
        const userInfo = authService.getCurrentUser();
        if (userInfo) {
          // For now, we'll need to fetch full user data from API
          // This is a placeholder - in a real app you'd have an endpoint to get current user
          setUser({
            id: userInfo.id,
            username: userInfo.username,
            email: '', // Would need to fetch from API
            level: 1,
            experience: 0,
            isActive: true,
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      logout();
      throw error; // Re-throw to let caller handle it
    }
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};