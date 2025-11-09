import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notification Service for Connectcall
 *
 * Handles push notifications for incoming calls on both iOS and Android.
 * - Requests permissions when host goes online for the first time
 * - Sends local notifications when app is in background/closed
 * - Navigates to incoming call screen when notification is tapped
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export interface IncomingCallData {
  callerId: string;
  callerName: string;
  callerPicture?: string;
  callType: 'audio' | 'video';
  callId: string;
}

class NotificationService {
  private permissionGranted: boolean = false;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Request notification permissions
   * Shows native iOS/Android permission dialog
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If not already granted, ask for permission
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // For Android, configure notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('incoming-calls', {
          name: 'Incoming Calls',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00D1C5',
          enableVibrate: true,
          enableLights: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      this.permissionGranted = finalStatus === 'granted';

      if (!this.permissionGranted) {
        console.warn('Notification permissions not granted');
      }

      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notification permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      this.permissionGranted = status === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Send a local notification for an incoming call
   * This is used when the app is in background or closed
   */
  async sendIncomingCallNotification(callData: IncomingCallData): Promise<string | null> {
    try {
      // Check if permissions are granted
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('Cannot send notification: permissions not granted');
        return null;
      }

      const callTypeText = callData.callType === 'video' ? 'video' : 'audio';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Connectcall',
          body: `Incoming ${callTypeText} call from ${callData.callerName}`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'incoming-call',
          data: {
            type: 'incoming-call',
            callerId: callData.callerId,
            callerName: callData.callerName,
            callerPicture: callData.callerPicture,
            callType: callData.callType,
            callId: callData.callId,
          },
        },
        trigger: null, // Show immediately
      });

      console.log('Incoming call notification sent:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending incoming call notification:', error);
      return null;
    }
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Set up notification listeners
   * This handles notification taps and routes to the appropriate screen
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ): void {
    // Remove existing listeners
    this.removeNotificationListeners();

    // Listener for when a notification is received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Listener for when user taps a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );
  }

  /**
   * Remove notification listeners
   * Call this when component unmounts or service is no longer needed
   */
  removeNotificationListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Get the last notification response (useful for app launch from notification)
   */
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      console.error('Error getting last notification response:', error);
      return null;
    }
  }

  /**
   * Check if notification permissions were previously requested
   */
  async wasPermissionRequested(): Promise<boolean> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      // If status is denied and can't ask again, it was previously requested and denied
      return status !== 'undetermined' && !canAskAgain;
    } catch (error) {
      console.error('Error checking permission request status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
