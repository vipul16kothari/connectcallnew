import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { notificationService, IncomingCallData } from '@/services/notificationService';
import { AppState } from 'react-native';

/**
 * Notification Context
 *
 * Handles global notification state and navigation:
 * - Listens for notification taps when app is in background/closed
 * - Routes to incoming call screen with call data
 * - Manages foreground notification display
 */

type NotificationContextType = {
  incomingCall: IncomingCallData | null;
  clearIncomingCall: () => void;
  sendIncomingCallNotification: (callData: IncomingCallData) => Promise<string | null>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  useEffect(() => {
    // Set up notification listeners
    notificationService.setupNotificationListeners(
      // Handler for when notification is received (app in foreground)
      (notification) => {
        console.log('📱 Notification received in foreground:', notification);
        const data = notification.request.content.data;

        if (data.type === 'incoming-call') {
          // App is in foreground, show the incoming call UI directly
          // Don't show system notification - just update state
          setIncomingCall({
            callerId: data.callerId as string,
            callerName: data.callerName as string,
            callerPicture: data.callerPicture as string,
            callType: data.callType as 'audio' | 'video',
            callId: data.callId as string,
          });
        }
      },

      // Handler for when notification is tapped (app in background/closed)
      (response) => {
        console.log('📱 Notification tapped:', response);
        const data = response.notification.request.content.data;

        if (data.type === 'incoming-call') {
          // Navigate to host calling screen (incoming call)
          router.push({
            pathname: '/host-calling',
            params: {
              callerName: data.callerName as string,
              callerPicture: data.callerPicture as string,
              isVideo: data.callType === 'video' ? '1' : '0',
              ratePerMin: '10', // Default rate
              callId: data.callId as string,
            },
          });
        }
      }
    );

    // Check for notification that launched the app
    notificationService.getLastNotificationResponse().then((response) => {
      if (response) {
        console.log('📱 App launched from notification:', response);
        const data = response.notification.request.content.data;

        if (data.type === 'incoming-call') {
          // Navigate to host calling screen
          setTimeout(() => {
            router.push({
              pathname: '/host-calling',
              params: {
                callerName: data.callerName as string,
                callerPicture: data.callerPicture as string,
                isVideo: data.callType === 'video' ? '1' : '0',
                ratePerMin: '10',
                callId: data.callId as string,
              },
            });
          }, 500);
        }
      }
    });

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 App state changed:', nextAppState);
    });

    // Cleanup listeners on unmount
    return () => {
      notificationService.removeNotificationListeners();
      subscription.remove();
    };
  }, [router]);

  const clearIncomingCall = () => {
    setIncomingCall(null);
  };

  const sendIncomingCallNotification = async (
    callData: IncomingCallData
  ): Promise<string | null> => {
    // Check if app is in foreground
    const appState = AppState.currentState;

    if (appState === 'active') {
      // App is in foreground - show incoming call UI directly
      console.log('📱 App in foreground, showing incoming call UI directly');
      setIncomingCall(callData);
      return null;
    } else {
      // App is in background/closed - send notification
      console.log('📱 App in background, sending notification');
      return await notificationService.sendIncomingCallNotification(callData);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        incomingCall,
        clearIncomingCall,
        sendIncomingCallNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
