import {
  StreamVideoClient,
  User as StreamUser,
  Call,
  CallingState,
} from '@stream-io/video-react-native-sdk';

// GetStream configuration
const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';

let streamClient: StreamVideoClient | null = null;
let currentCall: Call | null = null;

export interface CallConfig {
  callId: string;
  userId: string;
  userName: string;
  hostId: string;
  hostName: string;
  isVideo: boolean;
}

/**
 * Initialize Stream Video Client
 */
export async function initializeStreamClient(userId: string, userName: string, userToken: string) {
  try {
    if (streamClient) {
      return streamClient;
    }

    const user: StreamUser = {
      id: userId,
      name: userName,
    };

    streamClient = new StreamVideoClient({
      apiKey: STREAM_API_KEY,
      user,
      token: userToken,
    });

    console.log('Stream client initialized successfully');
    return streamClient;
  } catch (error) {
    console.error('Error initializing Stream client:', error);
    throw error;
  }
}

/**
 * Get the current Stream client instance
 */
export function getStreamClient(): StreamVideoClient | null {
  return streamClient;
}

/**
 * Create or join a call
 */
export async function createCall(config: CallConfig): Promise<Call> {
  try {
    if (!streamClient) {
      throw new Error('Stream client not initialized. Call initializeStreamClient first.');
    }

    // Create a unique call ID
    const callType = config.isVideo ? 'default' : 'audio_room';
    const call = streamClient.call(callType, config.callId);

    // Join the call
    await call.join({
      create: true,
      data: {
        members: [
          { user_id: config.userId },
          { user_id: config.hostId },
        ],
        custom: {
          hostId: config.hostId,
          hostName: config.hostName,
          isVideo: config.isVideo,
        },
      },
    });

    currentCall = call;
    console.log('Call created and joined successfully:', config.callId);
    return call;
  } catch (error) {
    console.error('Error creating call:', error);
    throw error;
  }
}

/**
 * Leave and end the current call
 */
export async function endCall(): Promise<void> {
  try {
    if (!currentCall) {
      console.warn('No active call to end');
      return;
    }

    await currentCall.leave();
    currentCall = null;
    console.log('Call ended successfully');
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

/**
 * Toggle audio mute
 */
export async function toggleMicrophone(muted: boolean): Promise<void> {
  try {
    if (!currentCall) {
      throw new Error('No active call');
    }

    if (muted) {
      await currentCall.microphone.disable();
    } else {
      await currentCall.microphone.enable();
    }
  } catch (error) {
    console.error('Error toggling microphone:', error);
    throw error;
  }
}

/**
 * Toggle camera (for video calls)
 */
export async function toggleCamera(enabled: boolean): Promise<void> {
  try {
    if (!currentCall) {
      throw new Error('No active call');
    }

    if (enabled) {
      await currentCall.camera.enable();
    } else {
      await currentCall.camera.disable();
    }
  } catch (error) {
    console.error('Error toggling camera:', error);
    throw error;
  }
}

/**
 * Flip camera (front/back for video calls)
 */
export async function flipCamera(): Promise<void> {
  try {
    if (!currentCall) {
      throw new Error('No active call');
    }

    await currentCall.camera.flip();
  } catch (error) {
    console.error('Error flipping camera:', error);
    throw error;
  }
}

/**
 * Get current call instance
 */
export function getCurrentCall(): Call | null {
  return currentCall;
}

/**
 * Get call state
 */
export function getCallState(): CallingState | null {
  if (!currentCall) {
    return null;
  }
  return currentCall.state.callingState;
}

/**
 * Subscribe to call state changes
 */
export function subscribeToCallState(callback: (state: CallingState) => void): (() => void) | null {
  if (!currentCall) {
    return null;
  }

  return currentCall.state.callingState$.subscribe((state) => {
    callback(state);
  }).unsubscribe;
}

/**
 * Cleanup Stream client on logout
 */
export async function disconnectStreamClient(): Promise<void> {
  try {
    if (currentCall) {
      await endCall();
    }

    if (streamClient) {
      await streamClient.disconnectUser();
      streamClient = null;
      console.log('Stream client disconnected');
    }
  } catch (error) {
    console.error('Error disconnecting Stream client:', error);
    throw error;
  }
}

/**
 * Generate a Stream user token (This should be done on the backend in production)
 * For now, we'll use a placeholder. In production, call your backend to generate tokens.
 */
export async function generateStreamToken(userId: string): Promise<string> {
  // TODO: Replace with actual backend call
  // For development, you can use Stream's development tokens or implement backend token generation
  console.warn(
    'Using placeholder token. Implement backend token generation for production.'
  );
  return 'placeholder-token';
}
