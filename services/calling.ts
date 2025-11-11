import NetInfo from '@react-native-community/netinfo';
import {
  userService,
  hostService,
  callService as appwriteCallService,
  transactionService,
  configService,
  type ConfiguredCallPricing,
  type AppwriteHostEarnings,
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
  totalDurationExactSeconds: number;
  audioSeconds: number;
  audioExactSeconds: number;
  videoSeconds: number;
  videoExactSeconds: number;
  hostEarnings: HostEarningsSnapshot;
  segments: Array<{
    type: 'audio' | 'video';
    durationSeconds: number;
    durationExactSeconds: number;
    coinsExact: number;
    coinsRounded: number;
  }>;
}

export interface HostEarningsSnapshot {
  audioSeconds: number;
  videoSeconds: number;
  audioAmount: number;
  videoAmount: number;
  totalAmount: number;
  currency: 'INR';
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

const HOST_AUDIO_RATE_PER_MIN_INR = 1;
const HOST_VIDEO_RATE_PER_MIN_INR = 6;

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
  private callDocumentId: string | null = null;
  private availableCoins = 0;
  private pricing: ConfiguredCallPricing = { ...DEFAULT_CALL_PRICING };
  private callSegments: BillingSegmentInternal[] = [];
  private currentCallType: 'audio' | 'video' = 'audio';
  private userDocumentId: string | null = null;
  private coinsDebitedRounded = 0;
  private billingSyncInProgress = false;

  reset() {
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
      const startedAt = Date.now();
      this.callSegments = [
        {
          type: isVideo ? 'video' : 'audio',
          start: startedAt,
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
    if (nextType === 'video') {
      const requiredCoins = this.pricing.videoCostPerMin * 2;
      const coinsRemaining = this.getCoinsRemaining(now);
      if (coinsRemaining < requiredCoins) {
        throw new Error('Insufficient balance to switch to video. Please recharge.');
      }
    }

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

  private summarizeSegments(referenceTime: number) {
    if (!this.callSegments.length) {
      return {
        segments: [] as Array<{
          type: 'audio' | 'video';
          durationSeconds: number;
          durationExactSeconds: number;
          coinsExact: number;
          coinsRounded: number;
        }>,
        audioSeconds: 0,
        videoSeconds: 0,
        totalSeconds: 0,
      };
    }

    let audioSeconds = 0;
    let videoSeconds = 0;

    const rawSegments = this.callSegments.map((segment) => {
      const end = segment.end ?? referenceTime;
      const durationMs = Math.max(0, end - segment.start);
      const durationExactSeconds = durationMs / 1000;
      const durationSeconds = Math.max(0, Math.round(durationExactSeconds));
      const rate =
        segment.type === 'video' ? this.pricing.videoCostPerMin : this.pricing.audioCostPerMin;
      const coinsExact = (durationExactSeconds / 60) * rate;
      const minutesStarted = durationExactSeconds > 0 ? Math.ceil(durationExactSeconds / 60) : 0;

      if (segment.type === 'video') {
        videoSeconds += durationExactSeconds;
      } else {
        audioSeconds += durationExactSeconds;
      }

      return {
        type: segment.type,
        durationSeconds,
        durationExactSeconds,
        coinsExact,
        rate,
        minutesStarted,
      };
    });

    const totalSeconds = audioSeconds + videoSeconds;
    const applyGrace = totalSeconds < 15;

    const segments = rawSegments.map((segment) => ({
      type: segment.type,
      durationSeconds: segment.durationSeconds,
      durationExactSeconds: segment.durationExactSeconds,
      coinsExact: segment.coinsExact,
      coinsRounded: applyGrace ? 0 : segment.minutesStarted * segment.rate,
    }));

    return {
      segments,
      audioSeconds,
      videoSeconds,
      totalSeconds,
    };
  }

  getBillingSnapshot(referenceTime: number = Date.now()): BillingSnapshot {
    const summary = this.summarizeSegments(referenceTime);

    const audioSecondsWhole = Math.floor(summary.audioSeconds);
    const videoSecondsWhole = Math.floor(summary.videoSeconds);
    const audioAmount = Number(((audioSecondsWhole / 60) * HOST_AUDIO_RATE_PER_MIN_INR).toFixed(2));
    const videoAmount = Number(((videoSecondsWhole / 60) * HOST_VIDEO_RATE_PER_MIN_INR).toFixed(2));
    const hostEarnings: HostEarningsSnapshot = {
      audioSeconds: audioSecondsWhole,
      videoSeconds: videoSecondsWhole,
      audioAmount,
      videoAmount,
      totalAmount: Number((audioAmount + videoAmount).toFixed(2)),
      currency: 'INR',
    };

    const coinsSpentExact = summary.segments.reduce((total, segment) => total + segment.coinsExact, 0);
    const coinsSpentRounded = summary.segments.reduce(
      (total, segment) => total + segment.coinsRounded,
      0
    );

    return {
      coinsSpentExact,
      coinsSpentRounded,
      totalDurationSeconds: Math.max(0, Math.round(summary.totalSeconds)),
      totalDurationExactSeconds: Math.max(0, summary.totalSeconds),
      audioSeconds: Math.max(0, Math.round(summary.audioSeconds)),
      audioExactSeconds: Math.max(0, summary.audioSeconds),
      videoSeconds: Math.max(0, Math.round(summary.videoSeconds)),
      videoExactSeconds: Math.max(0, summary.videoSeconds),
      hostEarnings,
      segments: summary.segments,
    };
  }

  getCoinsRemaining(referenceTime: number = Date.now()): number {
    const snapshot = this.getBillingSnapshot(referenceTime);
    return Math.max(0, this.availableCoins - snapshot.coinsSpentRounded);
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

    const snapshot = this.getBillingSnapshot(referenceTime);
    const coinsDue = snapshot.coinsSpentRounded;
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
          billingSegments: snapshot.segments,
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

      const hostEarningsPayload: AppwriteHostEarnings = {
        audioSeconds: snapshot.hostEarnings.audioSeconds,
        videoSeconds: snapshot.hostEarnings.videoSeconds,
        audioAmount: snapshot.hostEarnings.audioAmount,
        videoAmount: snapshot.hostEarnings.videoAmount,
        totalAmount: snapshot.hostEarnings.totalAmount,
        currency: snapshot.hostEarnings.currency,
        recordedAt: new Date().toISOString(),
      };

      if (this.callDocumentId) {
        await appwriteCallService.endCall(
          this.callDocumentId,
          snapshot.totalDurationSeconds,
          coinsSpent,
          snapshot.segments,
          hostEarningsPayload
        );
      }

      const userProfile = await userService.getUserProfile(userId);
      if (userProfile) {
        if (outstandingCoins !== 0) {
          await userService.updateWalletBalance(userProfile.$id, -outstandingCoins);
          this.coinsDebitedRounded += outstandingCoins;
        }

        const graceApplied = snapshot.totalDurationExactSeconds < 15;
        const billedAudioMinutes = graceApplied
          ? 0
          : snapshot.audioExactSeconds > 0
            ? Math.ceil(snapshot.audioExactSeconds / 60)
            : 0;
        const billedVideoMinutes = graceApplied
          ? 0
          : snapshot.videoExactSeconds > 0
            ? Math.ceil(snapshot.videoExactSeconds / 60)
            : 0;
        const parts: string[] = [];
        if (billedVideoMinutes > 0) {
          parts.push(`${billedVideoMinutes} min video`);
        }
        if (billedAudioMinutes > 0) {
          parts.push(`${billedAudioMinutes} min audio`);
        }

        if (coinsSpent > 0) {
          await transactionService.createTransaction({
            userId,
            type: 'call',
            amount: -coinsSpent,
            description: parts.length ? `Call - ${parts.join(' + ')}` : 'Call usage',
          });
        }
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
