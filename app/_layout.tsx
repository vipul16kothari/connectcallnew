import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ToastProvider>
      <UserProvider>
        <NotificationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="login" />
            <Stack.Screen name="profile-creation" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="host-profile" />
            <Stack.Screen name="calling" />
            <Stack.Screen name="wallet" />
            <Stack.Screen name="transactions" />
            <Stack.Screen name="privacy-policy" />
            <Stack.Screen name="change-language" />
            <Stack.Screen name="host-application" />
            <Stack.Screen name="host-verification" />
            <Stack.Screen name="host-dashboard" />
            <Stack.Screen name="host-calling" />
          </Stack>
        </NotificationProvider>
      </UserProvider>
    </ToastProvider>
  );
}
