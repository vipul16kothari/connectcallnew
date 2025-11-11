import NetInfo from '@react-native-community/netinfo';
import {
  userService,
  hostService,
  callService as appwriteCallService,
  transactionService,
  configService,
  type ConfiguredCallPricing,
} from './appwrite';

export interface CallDuration {
  maxDurationSeconds: number;
  warningThresholdSeconds: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  reconnectTimeRemaining: number;
}

export interface CallValidationResult {
  valid: boolean;
  error?: string;
  maxDuration?: number;
  pricing?: ConfiguredCallPricing;
  walletBalance?: number;
}

export interface BillingSnapshot {
  coinsSpentExact: number;
  coinsSpentRounded: number;
  totalDurationSeconds: number;
  audioSeconds: number;
  videoSeconds: number;
  segments: Array<{
    type: 'audio' | 'video';
    durationSeconds: number;
    coinsExact: number;
    coinsRounded: number;
  }>;
}

const DEFAULT_CALL_PRICING: ConfiguredCallPricing = {
  audioCostPerMin: 10,
  videoCostPerMin: 60,
  minimumDuration: 60,
  warningThreshold: 60,
  reconnectionTimeout: 45,
};

export const AUDIO_COST_PER_MIN = DEFAULT_CALL_PRICING.audioCostPerMin;
export const VIDEO_COST_PER_MIN = DEFAULT_CALL_PRICING.videoCostPerMin;

function roundSeconds(seconds: number): number {
  return Math.max(0, Math.round(seconds));
}

export function calculateMaxDuration(
  balance: number,
  costPerMin: number,
  warningThresholdSeconds: number
): CallDuration {
  const maxMinutes = costPerMin > 0 ? balance / costPerMin : 0;
  const maxDurationSeconds = Math.floor(maxMinutes * 60);

  return {
    maxDurationSeconds,
    warningThresholdSeconds,
  };
}

export function canStartCall(
  balance: number,
  costPerMin: number,
  minDurationSeconds: number
): {
  canCall: boolean;
  reason?: string;
} {
  if (costPerMin <= 0) {
    return {
      canCall: false,
      reason: 'Invalid call pricing. Please contact support.',
    };
  }

  const requiredBalance = (minDurationSeconds / 60) * costPerMin;

  if (balance < requiredBalance) {
    return {
      canCall: false,
      reason: `Insufficient balance. You need at least ${Math.ceil(requiredBalance)} coins to start this call.`,
    };
  }

  return { canCall: true };
}

export class ConnectionMonitor {
  private isMonitoring = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private onStatusChange?: (status: ConnectionStatus) => void;
  private disconnectTime = 0;
  private maxReconnectMs: number;
  private netInfoUnsubscribe: (() => void) | null = null;

  constructor(maxReconnectSeconds: number = DEFAULT_CALL_PRICING.reconnectionTimeout) {
    this.maxReconnectMs = maxReconnectSeconds * 1000;
  }

  updateTimeout(seconds: number) {
    this.maxReconnectMs = Math.max(5000, seconds * 1000);
  }

  start(onStatusChange: (status: ConnectionStatus) => void) {
    this.stop();
    this.isMonitoring = true;
    this.onStatusChange = onStatusChange;

    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      if (!this.isMonitoring) {
        return;
      }

      if (state.isConnected) {
        this.handleReconnection();
      } else {
        this.handleDisconnection();
      }
    });
  }

  stop() {
    this.isMonitoring = false;
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
  }

  private handleDisconnection() {
    this.disconnectTime = Date.now();

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(() => {
      const elapsed = Date.now() - this.disconnectTime;
      const remaining = Math.max(0, this.maxReconnectMs - elapsed);

      this.onStatusChange?.({
        isConnected: false,
        reconnectTimeRemaining: Math.ceil(remaining / 1000),
      });

      if (remaining <= 0) {
        this.stop();
      }
    }, 1000) as unknown as NodeJS.Timeout;
  }

  private handleReconnection() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    this.onStatusChange?.({
      isConnected: true,
      reconnectTimeRemaining: 0,
    });
  }
}

type BillingSegmentInternal = {
  type: 'audio' | 'video';
  start: number;
  end?: number;
};

export class CallManager {
  private callStartTime = 0;
  private callDocumentId: string | null = null;
  private availableCoins = 0;
  private pricing: ConfiguredCallPricing = { ...DEFAULT_CALL_PRICING };
  private callSegments: BillingSegmentInternal[] = [];
  private currentCallType: 'audio' | 'video' = 'audio';
  private userDocumentId: string | null = null;
  private coinsDebitedRounded = 0;
  private billingSyncInProgress = false;

  reset() {
    this.callStartTime = 0;
    this.callDocumentId = null;
    this.availableCoins = 0;
    this.pricing = { ...DEFAULT_CALL_PRICING };
    this.callSegments = [];
    this.currentCallType = 'audio';
    this.userDocumentId = null;
    this.coinsDebitedRounded = 0;
    this.billingSyncInProgress = false;
  }

  getPricing(): ConfiguredCallPricing {
    return this.pricing;
  }

  getAvailableCoins(): number {
    return this.availableCoins;
  }

  addCoins(amount: number) {
    this.availableCoins += amount;
  }

  async validateCall(
    userId: string,
    hostId: string,
    isVideo: boolean
  ): Promise<CallValidationResult> {
    this.reset();

    try {
      const [userProfile, hostProfile, configuredPricing] = await Promise.all([
        userService.getUserProfile(userId),
        hostService.getHostById(hostId),
        configService.getCallPricingConfig(),
      ]);

      if (!userProfile) {
        return { valid: false, error: 'User profile not found' };
      }

      const basePricing = configuredPricing ?? DEFAULT_CALL_PRICING;
      const resolvedPricing: ConfiguredCallPricing = {
        audioCostPerMin: hostProfile?.audioCostPerMin ?? basePricing.audioCostPerMin,
        videoCostPerMin: hostProfile?.videoCostPerMin ?? basePricing.videoCostPerMin,
        minimumDuration: basePricing.minimumDuration,
        warningThreshold: basePricing.warningThreshold,
        reconnectionTimeout: basePricing.reconnectionTimeout,
      };

      this.pricing = resolvedPricing;
      this.availableCoins = userProfile.walletBalance || 0;
      this.currentCallType = isVideo ? 'video' : 'audio';
      this.userDocumentId = userProfile.$id;

      const costPerMin = isVideo ? resolvedPricing.videoCostPerMin : resolvedPricing.audioCostPerMin;
      const canCall = canStartCall(this.availableCoins, costPerMin, resolvedPricing.minimumDuration);

      if (!canCall.canCall) {
        return { valid: false, error: canCall.reason };
      }

      const duration = calculateMaxDuration(
        this.availableCoins,
        costPerMin,
        resolvedPricing.warningThreshold
      );

      return {
        valid: true,
        maxDuration: duration.maxDurationSeconds,
        pricing: resolvedPricing,
        walletBalance: this.availableCoins,
      };
    } catch (error) {
      console.error('Call validation error:', error);
      return { valid: false, error: 'Failed to validate call' };
    }
  }

  async startCall(
    userId: string,
    hostId: string,
    callId: string,
    isVideo: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const callDoc = await appwriteCallService.createCall({
        callId,
        userId,
        hostId,
        callType: isVideo ? 'video' : 'audio',
        audioCostPerMin: this.pricing.audioCostPerMin,
        videoCostPerMin: this.pricing.videoCostPerMin,
      });

      this.callDocumentId = callDoc.$id;
      this.callStartTime = Date.now();
      this.callSegments = [
        {
          type: isVideo ? 'video' : 'audio',
          start: this.callStartTime,
        },
      ];
      this.currentCallType = isVideo ? 'video' : 'audio';
      this.coinsDebitedRounded = 0;

      return { success: true };
    } catch (error) {
      console.error('Start call error:', error);
      return { success: false, error: 'Failed to start call' };
    }
  }

  async switchCallType(isVideo: boolean): Promise<void> {
    const nextType: 'audio' | 'video' = isVideo ? 'video' : 'audio';
    if (nextType === this.currentCallType) {
      return;
    }

    const now = Date.now();
    this.finalizeCurrentSegment(now);

    await this.syncIncrementalBilling(now);

    this.callSegments.push({
      type: nextType,
      start: now,
    });

    this.currentCallType = nextType;

    if (this.callDocumentId) {
      try {
        await appwriteCallService.updateCallType(this.callDocumentId, nextType);
      } catch (error) {
        console.warn('Failed to update call type in backend', error);
      }
    }
  }

  private finalizeCurrentSegment(referenceTime: number = Date.now()) {
    if (!this.callSegments.length) {
      return;
    }

    const lastSegment = this.callSegments[this.callSegments.length - 1];
    if (!lastSegment.end) {
      lastSegment.end = referenceTime;
    }
  }

  getBillingSnapshot(referenceTime: number = Date.now()): BillingSnapshot {
    if (!this.callSegments.length) {
      return {
        coinsSpentExact: 0,
        coinsSpentRounded: 0,
        totalDurationSeconds: 0,
        audioSeconds: 0,
        videoSeconds: 0,
        segments: [],
      };
    }

    let audioSeconds = 0;
    let videoSeconds = 0;
    const segments: BillingSnapshot['segments'] = [];

    this.callSegments.forEach((segment) => {
      const start = segment.start;
      const end = segment.end ?? referenceTime;
      const durationSeconds = Math.max(0, (end - start) / 1000);
      const rate = segment.type === 'video' ? this.pricing.videoCostPerMin : this.pricing.audioCostPerMin;
      const coinsExact = (durationSeconds / 60) * rate;
      const coinsRounded = Math.ceil(coinsExact);

      if (segment.type === 'video') {
        videoSeconds += durationSeconds;
      } else {
        audioSeconds += durationSeconds;
      }

      segments.push({
        type: segment.type,
        durationSeconds: roundSeconds(durationSeconds),
        coinsExact,
        coinsRounded,
      });
    });

    const totalAudioCost = (audioSeconds / 60) * this.pricing.audioCostPerMin;
    const totalVideoCost = (videoSeconds / 60) * this.pricing.videoCostPerMin;
    const coinsExactTotal = totalAudioCost + totalVideoCost;

    return {
      coinsSpentExact: coinsExactTotal,
      coinsSpentRounded: Math.ceil(coinsExactTotal),
      totalDurationSeconds: roundSeconds(audioSeconds + videoSeconds),
      audioSeconds: roundSeconds(audioSeconds),
      videoSeconds: roundSeconds(videoSeconds),
      segments,
    };
  }

  getCoinsRemaining(referenceTime: number = Date.now()): number {
    const snapshot = this.getBillingSnapshot(referenceTime);
    return Math.max(0, this.availableCoins - snapshot.coinsSpentExact);
  }

  private calculateCoinsDueForStartedMinutes(referenceTime: number = Date.now()): {
    coinsDue: number;
    snapshot: BillingSnapshot;
  } {
    const snapshot = this.getBillingSnapshot(referenceTime);

    let coinsDue = 0;

    this.callSegments.forEach((segment) => {
      const end = segment.end ?? referenceTime;
      const durationSeconds = Math.max(0, (end - segment.start) / 1000);

      if (segment.end && durationSeconds === 0) {
        return;
      }

      const rate = segment.type === 'video' ? this.pricing.videoCostPerMin : this.pricing.audioCostPerMin;
      const minutesStarted = Math.max(1, Math.ceil(durationSeconds / 60));

      coinsDue += minutesStarted * rate;
    });

    return { coinsDue, snapshot };
  }

  async syncIncrementalBilling(referenceTime: number = Date.now()): Promise<{
    success: boolean;
    coinsDeducted: number;
  }> {
    if (!this.callDocumentId || !this.userDocumentId) {
      return { success: false, coinsDeducted: 0 };
    }

    if (this.billingSyncInProgress) {
      return { success: true, coinsDeducted: 0 };
    }

    const { coinsDue, snapshot } = this.calculateCoinsDueForStartedMinutes(referenceTime);
    const coinsToBill = coinsDue - this.coinsDebitedRounded;

    if (coinsToBill <= 0) {
      return { success: true, coinsDeducted: 0 };
    }

    this.billingSyncInProgress = true;

    try {
      const walletCoinsRemaining = this.availableCoins - this.coinsDebitedRounded;
      if (walletCoinsRemaining < coinsToBill) {
        throw new Error('Insufficient wallet balance for incremental billing');
      }

      try {
        await appwriteCallService.updateCallProgress(this.callDocumentId, {
          duration: snapshot.totalDurationSeconds,
          coinsSpent: coinsDue,
        });
      } catch (error) {
        console.warn('Failed to sync call progress', error);
      }

      await userService.updateWalletBalance(this.userDocumentId, -coinsToBill);

      this.coinsDebitedRounded += coinsToBill;

      return { success: true, coinsDeducted: coinsToBill };
    } catch (error) {
      console.error('Incremental billing failed', error);
      return { success: false, coinsDeducted: 0 };
    } finally {
      this.billingSyncInProgress = false;
    }
  }

  async endCall(userId: string): Promise<{ success: boolean; coinsSpent: number }> {
    try {
      this.finalizeCurrentSegment();

      await this.syncIncrementalBilling();

      const snapshot = this.getBillingSnapshot();
      const coinsSpent = snapshot.coinsSpentRounded;
      const outstandingCoins = coinsSpent - this.coinsDebitedRounded;

      if (this.callDocumentId) {
        await appwriteCallService.endCall(
          this.callDocumentId,
          snapshot.totalDurationSeconds,
          coinsSpent,
          snapshot.segments
        );
      }

      const userProfile = await userService.getUserProfile(userId);
      if (userProfile) {
        if (outstandingCoins !== 0) {
          await userService.updateWalletBalance(userProfile.$id, -outstandingCoins);
          this.coinsDebitedRounded += outstandingCoins;
        }

        const videoMinutes = snapshot.videoSeconds / 60;
        const audioMinutes = snapshot.audioSeconds / 60;
        const parts: string[] = [];
        if (videoMinutes >= 1) {
          parts.push(`${Math.max(1, Math.round(videoMinutes))} min video`);
        }
        if (audioMinutes >= 1) {
          parts.push(`${Math.max(1, Math.round(audioMinutes))} min audio`);
        }

        await transactionService.createTransaction({
          userId,
          type: 'call',
          amount: -coinsSpent,
          description: parts.length ? `Call - ${parts.join(' + ')}` : 'Call usage',
        });
      }

      const result = { success: true, coinsSpent };
      this.reset();
      return result;
    } catch (error) {
      console.error('End call error:', error);
      this.reset();
      return { success: false, coinsSpent: 0 };
    }
  }
}

export const callManager = new CallManager();
