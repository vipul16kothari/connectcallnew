/**
 * Calling Service
 * Handles all live calling functionality with pre-call checks and smart logic
 *
 * Note: Stream Video SDK integration has been removed to prevent native module
 * initialization errors. If real-time video calling is needed, integrate the
 * SDK in a separate lazy-loaded module with proper error boundaries.
 */

import NetInfo from '@react-native-community/netinfo';
import { userService, callService as appwriteCallService, transactionService } from './appwrite';

// Call costs per minute
export const AUDIO_COST_PER_MIN = 10;
export const VIDEO_COST_PER_MIN = 60;

export interface CallConfig {
  userId: string;
  hostId: string;
  isVideo: boolean;
  costPerMin: number;
}

export interface CallDuration {
  maxDurationSeconds: number;
  warningThresholdSeconds: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  reconnectTimeRemaining: number;
}

/**
 * Calculate maximum call duration based on wallet balance
 */
export function calculateMaxDuration(balance: number, costPerMin: number): CallDuration {
  const maxMinutes = balance / costPerMin;
  const maxDurationSeconds = Math.floor(maxMinutes * 60);
  const warningThresholdSeconds = 60; // Warn when less than 1 minute remains

  return {
    maxDurationSeconds,
    warningThresholdSeconds,
  };
}

/**
 * Check if user has sufficient balance for call
 */
export function canStartCall(balance: number, costPerMin: number, minDurationSeconds: number = 60): {
  canCall: boolean;
  reason?: string;
} {
  const requiredBalance = (minDurationSeconds / 60) * costPerMin;

  if (balance < requiredBalance) {
    return {
      canCall: false,
      reason: `Insufficient balance. You need at least ${Math.ceil(requiredBalance)} coins to start this call.`,
    };
  }

  return { canCall: true };
}

/**
 * Calculate coins spent based on call duration
 */
export function calculateCoinsSpent(durationSeconds: number, costPerMin: number): number {
  const minutes = Math.ceil(durationSeconds / 60); // Round up to nearest minute
  return minutes * costPerMin;
}

/**
 * Create call instance
 *
 * Note: This function previously used GetStream.io SDK but has been removed
 * to prevent native module crashes. For real video calling, integrate a
 * lightweight SDK or implement custom WebRTC solution.
 */
export async function createCall(
  userId: string,
  userName: string,
  callId: string
): Promise<boolean> {
  try {
    console.log('Creating call for user:', userId, userName, callId);
    // Placeholder for future video calling implementation
    // When implementing, use dynamic import() to lazy-load heavy native modules
    return true;
  } catch (error) {
    console.error('Error creating call:', error);
    return false;
  }
}

/**
 * Monitor network connection during call
 */
export class ConnectionMonitor {
  private isMonitoring: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private onStatusChange?: (status: ConnectionStatus) => void;
  private disconnectTime: number = 0;
  private readonly MAX_RECONNECT_TIME = 45000; // 45 seconds

  start(onStatusChange: (status: ConnectionStatus) => void) {
    this.isMonitoring = true;
    this.onStatusChange = onStatusChange;

    NetInfo.addEventListener((state) => {
      if (!this.isMonitoring) return;

      if (state.isConnected) {
        // Connection restored
        this.handleReconnection();
      } else {
        // Connection lost
        this.handleDisconnection();
      }
    });
  }

  stop() {
    this.isMonitoring = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private handleDisconnection() {
    this.disconnectTime = Date.now();

    // Start countdown for reconnection
    this.reconnectTimeout = setInterval(() => {
      const elapsed = Date.now() - this.disconnectTime;
      const remaining = Math.max(0, this.MAX_RECONNECT_TIME - elapsed);

      if (this.onStatusChange) {
        this.onStatusChange({
          isConnected: false,
          reconnectTimeRemaining: Math.ceil(remaining / 1000),
        });
      }

      if (remaining <= 0) {
        // Time's up - terminate call
        this.stop();
      }
    }, 1000) as any;
  }

  private handleReconnection() {
    if (this.reconnectTimeout) {
      clearInterval(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.onStatusChange) {
      this.onStatusChange({
        isConnected: true,
        reconnectTimeRemaining: 0,
      });
    }
  }
}

/**
 * Complete call flow manager
 */
export class CallManager {
  private connectionMonitor: ConnectionMonitor;
  private callStartTime: number = 0;
  private callDocumentId: string | null = null;
  private timerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connectionMonitor = new ConnectionMonitor();
  }

  /**
   * Pre-call validation
   */
  async validateCall(
    userId: string,
    hostId: string,
    isVideo: boolean
  ): Promise<{ valid: boolean; error?: string; maxDuration?: number }> {
    try {
      // Get user's wallet balance
      const userProfile = await userService.getUserProfile(userId);
      if (!userProfile) {
        return { valid: false, error: 'User profile not found' };
      }

      const costPerMin = isVideo ? VIDEO_COST_PER_MIN : AUDIO_COST_PER_MIN;
      const balance = userProfile.walletBalance || 0;

      // Check if user can start call
      const canCall = canStartCall(balance, costPerMin);
      if (!canCall.canCall) {
        return { valid: false, error: canCall.reason };
      }

      // Calculate max duration
      const duration = calculateMaxDuration(balance, costPerMin);

      return {
        valid: true,
        maxDuration: duration.maxDurationSeconds,
      };
    } catch (error) {
      console.error('Call validation error:', error);
      return { valid: false, error: 'Failed to validate call' };
    }
  }

  /**
   * Start call
   */
  async startCall(
    userId: string,
    hostId: string,
    callId: string,
    isVideo: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create call record in Appwrite
      const callDoc = await appwriteCallService.createCall({
        callId,
        userId,
        hostId,
        callType: isVideo ? 'video' : 'audio',
      });

      this.callDocumentId = callDoc.$id;
      this.callStartTime = Date.now();

      // Start connection monitoring
      this.connectionMonitor.start((status) => {
        if (!status.isConnected && status.reconnectTimeRemaining === 0) {
          // Connection timeout - end call
          this.endCall(userId, isVideo);
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Start call error:', error);
      return { success: false, error: 'Failed to start call' };
    }
  }

  /**
   * End call and process charges
   */
  async endCall(
    userId: string,
    isVideo: boolean
  ): Promise<{ success: boolean; coinsSpent: number }> {
    try {
      // Stop monitoring
      this.connectionMonitor.stop();
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      // Calculate duration and coins
      const durationSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
      const costPerMin = isVideo ? VIDEO_COST_PER_MIN : AUDIO_COST_PER_MIN;
      const coinsSpent = calculateCoinsSpent(durationSeconds, costPerMin);

      // Update call record
      if (this.callDocumentId) {
        await appwriteCallService.endCall(this.callDocumentId, durationSeconds, coinsSpent);
      }

      // Deduct coins from wallet
      const userProfile = await userService.getUserProfile(userId);
      if (userProfile) {
        await userService.updateWalletBalance(userProfile.$id, -coinsSpent);

        // Create transaction record
        await transactionService.createTransaction({
          userId,
          type: 'call',
          amount: -coinsSpent,
          description: `${isVideo ? 'Video' : 'Audio'} call - ${Math.floor(durationSeconds / 60)} minutes`,
        });
      }

      return { success: true, coinsSpent };
    } catch (error) {
      console.error('End call error:', error);
      return { success: false, coinsSpent: 0 };
    }
  }
}

export const callManager = new CallManager();
