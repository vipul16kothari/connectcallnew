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
    try {
      setIsLoading(true);
      const session = await authService.createPhoneSession(phoneNumber);
      const authUser = await authService.getCurrentUser();

      if (authUser) {
        await loadUserData(authUser);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async (phoneNumber: string, name: string) => {
    try {
      setIsLoading(true);
      const authUser = await authService.createAccount(phoneNumber, name);

      // Create session
      await authService.createPhoneSession(phoneNumber);

      // Set auth user (profile will be created in next step)
      setUser({ authUser, userProfile: null, hostProfile: null });
    } catch (error) {
      console.error('Create account error:', error);
      throw error;
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
    try {
      if (!user?.authUser) {
        throw new Error('No authenticated user');
      }

      setIsLoading(true);
      const userProfile = await userService.createUserProfile(user.authUser.$id, data);

      setUser({
        ...user,
        userProfile,
      });
    } catch (error) {
      console.error('Create profile error:', error);
      throw error;
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
    try {
      if (!user?.userProfile) {
        throw new Error('No user profile');
      }

      const updatedProfile = await userService.updateUserProfile(user.userProfile.$id, {
        hostStatus: status,
        isHost: status === 'approved',
      });

      setUser({
        ...user,
        userProfile: updatedProfile,
      });
    } catch (error) {
      console.error('Error updating host status:', error);
      throw error;
    }
  };

  const updateWallet = async (amount: number) => {
    try {
      if (!user?.userProfile) {
        throw new Error('No user profile');
      }

      const updatedProfile = await userService.updateWalletBalance(
        user.userProfile.$id,
        amount
      );

      setUser({
        ...user,
        userProfile: updatedProfile,
      });
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
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
