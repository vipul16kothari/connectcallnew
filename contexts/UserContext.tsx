import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authService,
  userService,
  AppwriteUser,
  hostService,
  AppwriteHost,
} from '@/services/appwrite';
import { Models } from 'appwrite';

export type UserProfile = {
  // Appwrite auth user
  authUser: Models.User<Models.Preferences> | null;
  // User profile from database
  userProfile: AppwriteUser | null;
  // Host profile if user is a host
  hostProfile: AppwriteHost | null;
};

type UserContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string) => Promise<void>;
  createAccount: (phoneNumber: string, name: string) => Promise<void>;
  createUserProfile: (data: {
    name: string;
    phone: string;
    gender: 'Male' | 'Female' | 'Other';
    language: string;
  }) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateHostStatus: (status: 'none' | 'pending' | 'approved') => Promise<void>;
  updateWallet: (amount: number) => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const AUTH_SESSION_KEY = '@auth_session';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if user is already authenticated
      const authUser = await authService.getCurrentUser();
      if (authUser) {
        await loadUserData(authUser);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (authUser: Models.User<Models.Preferences>) => {
    try {
      // Load user profile from database
      const userProfile = await userService.getUserProfile(authUser.$id);

      if (!userProfile) {
        // User authenticated but no profile - redirect to profile creation
        setUser({ authUser, userProfile: null, hostProfile: null });
        return;
      }

      // Load host profile if user is a host
      let hostProfile: AppwriteHost | null = null;
      if (userProfile.isHost) {
        hostProfile = await hostService.getHostByUserId(authUser.$id);
      }

      setUser({ authUser, userProfile, hostProfile });
      await AsyncStorage.setItem(AUTH_SESSION_KEY, 'authenticated');
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser({ authUser, userProfile: null, hostProfile: null });
    }
  };

  const login = async (phoneNumber: string) => {
    setIsLoading(true);
    try {
      const session = await authService.createPhoneSession(phoneNumber);
      const authUser = await authService.getCurrentUser();

      if (authUser) {
        await loadUserData(authUser);
      } else {
        throw new Error('Failed to get user after login');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw with additional context
      const enhancedError = new Error(error.message || 'Login failed');
      (enhancedError as any).code = error.code;
      throw enhancedError;
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async (phoneNumber: string, name: string) => {
    setIsLoading(true);
    try {
      const authUser = await authService.createAccount(phoneNumber, name);

      // Create session
      await authService.createPhoneSession(phoneNumber);

      // Set auth user (profile will be created in next step)
      setUser({ authUser, userProfile: null, hostProfile: null });
    } catch (error: any) {
      console.error('Create account error:', error);
      // Re-throw with additional context
      const enhancedError = new Error(error.message || 'Account creation failed');
      (enhancedError as any).code = error.code;
      throw enhancedError;
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async (data: {
    name: string;
    phone: string;
    gender: 'Male' | 'Female' | 'Other';
    language: string;
  }) => {
    if (!user?.authUser) {
      throw new Error('No authenticated user. Please login first.');
    }

    setIsLoading(true);
    try {
      const userProfile = await userService.createUserProfile(user.authUser.$id, data);

      setUser({
        ...user,
        userProfile,
      });
    } catch (error: any) {
      console.error('Create profile error:', error);
      const enhancedError = new Error(error.message || 'Failed to create profile');
      (enhancedError as any).code = error.code;
      throw enhancedError;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    try {
      if (!user?.authUser) return;

      const userProfile = await userService.getUserProfile(user.authUser.$id);

      let hostProfile: AppwriteHost | null = null;
      if (userProfile?.isHost) {
        hostProfile = await hostService.getHostByUserId(user.authUser.$id);
      }

      setUser({
        authUser: user.authUser,
        userProfile,
        hostProfile,
      });
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const updateHostStatus = async (status: 'none' | 'pending' | 'approved') => {
    if (!user?.userProfile) {
      throw new Error('No user profile found');
    }

    try {
      const updatedProfile = await userService.updateUserProfile(user.userProfile.$id, {
        hostStatus: status,
        isHost: status === 'approved',
      });

      setUser({
        ...user,
        userProfile: updatedProfile,
      });
    } catch (error: any) {
      console.error('Error updating host status:', error);
      const enhancedError = new Error(error.message || 'Failed to update host status');
      (enhancedError as any).code = error.code;
      throw enhancedError;
    }
  };

  const updateWallet = async (amount: number) => {
    if (!user?.userProfile) {
      throw new Error('No user profile found');
    }

    try {
      const updatedProfile = await userService.updateWalletBalance(
        user.userProfile.$id,
        amount
      );

      setUser({
        ...user,
        userProfile: updatedProfile,
      });
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      const enhancedError = new Error(error.message || 'Failed to update wallet');
      (enhancedError as any).code = error.code;
      throw enhancedError;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      const enhancedError = new Error(error.message || 'Logout failed');
      (enhancedError as any).code = error.code;
      throw enhancedError;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user?.authUser,
        login,
        createAccount,
        createUserProfile,
        refreshUserProfile,
        updateHostStatus,
        updateWallet,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
