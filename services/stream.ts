import { STREAM_CONFIG } from '@/config/api.config';
import type {
  Call,
  StreamVideoClient,
  User as StreamUser,
} from '@stream-io/video-react-native-sdk';
import type { ComponentType, ReactNode } from 'react';

const STREAM_API_KEY = STREAM_CONFIG.apiKey;

type StreamSDKModule = typeof import('@stream-io/video-react-native-sdk');

let sdkModule: StreamSDKModule | null = null;
let sdkModulePromise: Promise<StreamSDKModule> | null = null;
let streamClient: StreamVideoClient | null = null;
let currentCall: Call | null = null;
let currentUserId: string | null = null;
let callEndedUnsubscribe: (() => void) | null = null;
let lastKnownCameraEnabled = false;
let lastKnownMicrophoneEnabled = true;

export interface StreamCallOptions {
  callId: string;
  userId: string;
  userName: string;
  userImage?: string;
  hostId: string;
  hostName: string;
  hostImage?: string;
  isVideo: boolean;
}

export interface StreamCallSession {
  client: StreamVideoClient;
  call: Call;
}

export interface StreamUIComponents {
  StreamVideo: ComponentType<{ client: StreamVideoClient; children: ReactNode }>;
  StreamCall: ComponentType<{ call: Call; children: ReactNode }>;
  StreamTheme: ComponentType<{ children: ReactNode }>;
  CallContent: ComponentType<any>;
  useCallStateHooks: StreamSDKModule['useCallStateHooks'];
}

async function loadStreamSDK(): Promise<StreamSDKModule> {
  if (sdkModule) {
    return sdkModule;
  }

  if (!sdkModulePromise) {
    sdkModulePromise = import('@stream-io/video-react-native-sdk');
  }

  try {
    sdkModule = await sdkModulePromise;
    return sdkModule;
  } catch (error) {
    sdkModulePromise = null;
    throw error;
  }
}

function ensureApiKeyConfigured() {
  if (!STREAM_API_KEY || STREAM_API_KEY.startsWith('YOUR_')) {
    throw new Error('GetStream API key is not configured. Update STREAM_CONFIG.apiKey.');
  }
}

function resolveTokenEndpoint(): string {
  const endpoint = STREAM_CONFIG.tokenEndpoint;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
  if (!baseUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL must be set when STREAM_CONFIG.tokenEndpoint is relative.'
    );
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${normalizedBase}/${normalizedPath}`;
}

async function fetchStreamToken(userId: string): Promise<string> {
  ensureApiKeyConfigured();

  if (STREAM_CONFIG.tokenProvider === 'client') {
    const sdk = await loadStreamSDK();
    return sdk.StreamVideoClient.devToken(userId);
  }

  const endpoint = resolveTokenEndpoint();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Stream token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data || typeof data.token !== 'string') {
    throw new Error('Invalid response from Stream token endpoint. Expected { token: string }.');
  }

  return data.token;
}

export async function initializeStreamClient(
  user: Pick<StreamUser, 'id' | 'name' | 'image'>,
  token?: string
): Promise<StreamVideoClient> {
  ensureApiKeyConfigured();
  const sdk = await loadStreamSDK();

  if (streamClient && currentUserId === user.id) {
    return streamClient;
  }

  if (streamClient) {
    try {
      await streamClient.disconnectUser();
    } catch (error) {
      console.warn('Failed to disconnect previous Stream client', error);
    }
    streamClient = null;
    currentUserId = null;
  }

  const authToken = token || (await fetchStreamToken(user.id));
  const streamUser: StreamUser = {
    id: user.id,
    name: user.name,
    image: user.image,
  };

  streamClient = sdk.StreamVideoClient.getOrCreateInstance({
    apiKey: STREAM_API_KEY,
    user: streamUser,
    token: authToken,
  });
  currentUserId = user.id;

  return streamClient;
}

async function teardownCallListener() {
  if (callEndedUnsubscribe) {
    try {
      callEndedUnsubscribe();
    } catch (error) {
      console.warn('Failed to unsubscribe Stream call listener', error);
    }
    callEndedUnsubscribe = null;
  }
}

export async function startCallSession(options: StreamCallOptions): Promise<StreamCallSession> {
  const client = await initializeStreamClient({
    id: options.userId,
    name: options.userName,
    image: options.userImage,
  });

  if (currentCall) {
    try {
      await currentCall.leave({ reject: false });
    } catch (error) {
      console.warn('Failed to leave previous Stream call', error);
    } finally {
      currentCall = null;
      await teardownCallListener();
    }
  }

  const callType = options.isVideo ? 'default' : 'audio_room';
  const call = client.call(callType, options.callId);

  try {
    await call.join({
      create: true,
      data: {
        members: [
          { user_id: options.userId, role: 'user' },
          { user_id: options.hostId, role: 'host' },
        ],
        custom: {
          hostId: options.hostId,
          hostName: options.hostName,
          hostImage: options.hostImage,
          requestedVideo: options.isVideo,
        },
      },
    });

    await call.microphone.enable();
    lastKnownMicrophoneEnabled = true;
    if (options.isVideo) {
      await call.camera.enable();
      lastKnownCameraEnabled = true;
    } else {
      await call.camera.disable();
      lastKnownCameraEnabled = false;
    }
  } catch (error) {
    try {
      await call.leave({ reject: true });
    } catch (leaveError) {
      console.warn('Failed to leave call after join error', leaveError);
    }
    throw error;
  }

  await teardownCallListener();
  callEndedUnsubscribe = call.on('call.ended', () => {
    currentCall = null;
    teardownCallListener();
  });

  currentCall = call;
  return { client, call };
}

export function getCurrentCall(): Call | null {
  return currentCall;
}

function requireActiveCall(): Call {
  if (!currentCall) {
    throw new Error('No active Stream call');
  }
  return currentCall;
}

export async function leaveCurrentCall(): Promise<void> {
  if (!currentCall) {
    return;
  }

  try {
    await currentCall.leave({ reject: false });
  } finally {
    currentCall = null;
    lastKnownCameraEnabled = false;
    lastKnownMicrophoneEnabled = true;
    await teardownCallListener();
  }
}

export async function setMicrophoneEnabled(enabled: boolean): Promise<void> {
  const call = requireActiveCall();
  if (enabled) {
    await call.microphone.enable();
  } else {
    await call.microphone.disable();
  }
  lastKnownMicrophoneEnabled = enabled;
}

export async function setCameraEnabled(enabled: boolean): Promise<void> {
  const call = requireActiveCall();
  if (enabled) {
    await call.camera.enable();
  } else {
    await call.camera.disable();
  }
  lastKnownCameraEnabled = enabled;
}

export async function flipCamera(): Promise<void> {
  const call = requireActiveCall();
  await call.camera.flip();
}

export async function loadUIComponents(): Promise<StreamUIComponents> {
  const sdk = await loadStreamSDK();
  return {
    StreamVideo: sdk.StreamVideo,
    StreamCall: sdk.StreamCall,
    StreamTheme: sdk.StreamTheme,
    CallContent: sdk.CallContent,
    useCallStateHooks: sdk.useCallStateHooks,
  };
}

export async function reconnectCurrentCall(): Promise<void> {
  if (!currentCall) {
    return;
  }

  try {
    await currentCall.join({ create: false });

    if (lastKnownMicrophoneEnabled) {
      await currentCall.microphone.enable();
    } else {
      await currentCall.microphone.disable();
    }

    if (lastKnownCameraEnabled) {
      await currentCall.camera.enable();
    } else {
      await currentCall.camera.disable();
    }
  } catch (error) {
    throw error;
  }
}

export async function disconnectStreamClient(): Promise<void> {
  await leaveCurrentCall();

  if (streamClient) {
    try {
      await streamClient.disconnectUser();
    } catch (error) {
      console.warn('Failed to disconnect Stream client', error);
    } finally {
      streamClient = null;
      currentUserId = null;
    }
  }
}
