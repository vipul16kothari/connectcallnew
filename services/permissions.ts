/**
 * Permissions Service
 * Handles all runtime permission checks for calling features
 */

import { Platform, Linking, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

export type PermissionType = 'microphone' | 'camera' | 'bluetooth';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface CallPermissions {
  microphone: PermissionStatus;
  camera?: PermissionStatus;
  bluetooth?: PermissionStatus;
}

/**
 * Check microphone permission status
 */
export async function checkMicrophonePermission(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Audio.getPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: canAskAgain ?? true,
      status,
    };
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return { granted: false, canAskAgain: true, status: 'undetermined' };
  }
}

/**
 * Check camera permission status
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: canAskAgain ?? true,
      status,
    };
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return { granted: false, canAskAgain: true, status: 'undetermined' };
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Audio.requestPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: canAskAgain ?? true,
      status,
    };
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: canAskAgain ?? true,
      status,
    };
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
}

/**
 * Check all required permissions for a call
 */
export async function checkCallPermissions(
  isVideo: boolean
): Promise<CallPermissions> {
  const microphone = await checkMicrophonePermission();
  const permissions: CallPermissions = { microphone };

  if (isVideo) {
    permissions.camera = await checkCameraPermission();
  }

  return permissions;
}

/**
 * Request all required permissions for a call
 */
export async function requestCallPermissions(
  isVideo: boolean
): Promise<{ allGranted: boolean; permissions: CallPermissions }> {
  const microphone = await requestMicrophonePermission();
  const permissions: CallPermissions = { microphone };

  let allGranted = microphone.granted;

  if (isVideo) {
    const camera = await requestCameraPermission();
    permissions.camera = camera;
    allGranted = allGranted && camera.granted;
  }

  return { allGranted, permissions };
}

/**
 * Open device settings for the app
 */
export async function openAppSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening app settings:', error);
    Alert.alert(
      'Settings Unavailable',
      'Unable to open settings. Please go to Settings > Apps > Connectcall to enable permissions.'
    );
  }
}

/**
 * Get permission name for display
 */
export function getPermissionName(type: PermissionType): string {
  switch (type) {
    case 'microphone':
      return 'Microphone';
    case 'camera':
      return 'Camera';
    case 'bluetooth':
      return 'Bluetooth';
  }
}

/**
 * Get permission explanation text
 */
export function getPermissionExplanation(type: PermissionType): string {
  switch (type) {
    case 'microphone':
      return 'We need access to your microphone to transmit your voice during calls.';
    case 'camera':
      return 'We need access to your camera to enable video calling.';
    case 'bluetooth':
      return 'We need bluetooth access to connect to wireless headsets.';
  }
}

/**
 * Get permission icon name
 */
export function getPermissionIcon(type: PermissionType): string {
  switch (type) {
    case 'microphone':
      return 'mic';
    case 'camera':
      return 'videocam';
    case 'bluetooth':
      return 'bluetooth';
  }
}
