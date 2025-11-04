import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  language: string;
  isHost?: boolean;
  hostStatus?: 'none' | 'pending' | 'approved';
};

type UserContextType = {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  updateHostStatus: (status: 'none' | 'pending' | 'approved') => Promise<void>;
  clearUserProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_PROFILE_KEY = '@user_profile';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        setUserProfileState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const setUserProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      setUserProfileState(profile);
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const updateHostStatus = async (status: 'none' | 'pending' | 'approved') => {
    if (!userProfile) return;

    const updated = { ...userProfile, hostStatus: status, isHost: status === 'approved' };
    await setUserProfile(updated);
  };

  const clearUserProfile = async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      setUserProfileState(null);
    } catch (error) {
      console.error('Error clearing user profile:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile, updateHostStatus, clearUserProfile }}>
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
