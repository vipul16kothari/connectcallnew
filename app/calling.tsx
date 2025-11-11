
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import InCallRechargeSheet from '@/components/InCallRechargeSheet';
import { parseError } from '@/utils/errorHandler';
import {
  calculateMaxDuration,
  ConnectionMonitor,
  callManager,
  AUDIO_COST_PER_MIN,
  VIDEO_COST_PER_MIN,
} from '@/services/calling';
import type { StreamCallSession, StreamUIComponents } from '@/services/stream';
import * as StreamService from '@/services/stream';

type CallPhase = 'initializing' | 'active' | 'reconnecting' | 'ending' | 'ended' | 'error';

type ConnectionState = {
  isConnected: boolean;
  reconnectTimeRemaining: number;
};

type CallScreenParams = {
  hostId?: string | string[];
  hostName?: string | string[];
  hostPicture?: string | string[];
  isVideo?: string | string[];
  costPerMin?: string | string[];
  audioRate?: string | string[];
  videoRate?: string | string[];
  callId?: string | string[];
};

const AUDIO_PLACEHOLDER = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80';

export default function CallingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<CallScreenParams>();
  const { user } = useUser();
  const { showError, showSuccess, showWarning, showInfo } = useToast();

  const hostId = Array.isArray(params.hostId) ? params.hostId[0] : params.hostId;
  const hostName = Array.isArray(params.hostName) ? params.hostName[0] : params.hostName;
  const hostPicture = Array.isArray(params.hostPicture) ? params.hostPicture[0] : params.hostPicture;
  const callIdParam = Array.isArray(params.callId) ? params.callId[0] : params.callId;
  const isVideoParam = Array.isArray(params.isVideo) ? params.isVideo[0] : params.isVideo;
  const costPerMinParam = Array.isArray(params.costPerMin) ? params.costPerMin[0] : params.costPerMin;
  const audioRateParam = Array.isArray(params.audioRate) ? params.audioRate[0] : params.audioRate;
  const videoRateParam = Array.isArray(params.videoRate) ? params.videoRate[0] : params.videoRate;

  const initialCallType: 'audio' | 'video' = isVideoParam === '1' ? 'video' : 'audio';
  const parsedAudioRate = Number.parseInt(audioRateParam || costPerMinParam || '', 10);
  const parsedVideoRate = Number.parseInt(videoRateParam || '', 10);
  const defaultAudioRate = Number.isFinite(parsedAudioRate) ? parsedAudioRate : AUDIO_COST_PER_MIN;
  const defaultVideoRate = Number.isFinite(parsedVideoRate) ? parsedVideoRate : VIDEO_COST_PER_MIN;
  const hostDisplayName = hostName || 'Host';
  const hostImage = hostPicture || AUDIO_PLACEHOLDER;

  const callIdRef = useRef<string>(callIdParam || `call-${Date.now()}`);
  const hasStartedRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionMonitor = useRef(new ConnectionMonitor());
  const callStartedRef = useRef(false);
  const isEndingRef = useRef(false);
  const isVideoEnabledRef = useRef(initialCallType === 'video');
  const walletBalanceRef = useRef(0);
  const wasDisconnectedRef = useRef(false);
  const billingSyncFailedRef = useRef(false);
  const pricingRef = useRef({
    audioCostPerMin: defaultAudioRate,
    videoCostPerMin: defaultVideoRate,
    warningThreshold: 60,
    reconnectionTimeout: 45,
  });

  const [phase, setPhase] = useState<CallPhase>('initializing');
  const [session, setSession] = useState<StreamCallSession | null>(null);
  const [uiComponents, setUiComponents] = useState<StreamUIComponents | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentCallType, setCurrentCallType] = useState<'audio' | 'video'>(initialCallType);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLowTime, setIsLowTime] = useState(false);
  const [showRechargeSheet, setShowRechargeSheet] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: true,
    reconnectTimeRemaining: 0,
  });
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [pricing, setPricing] = useState(pricingRef.current);

  const currentRate =
    currentCallType === 'video' ? pricing.videoCostPerMin : pricing.audioCostPerMin;
  const showAudioPlaceholder = currentCallType === 'audio' || !session || !uiComponents;

  const finalizeCall = useCallback(
    async (reason: 'user' | 'timeout' | 'connection' | 'remote' | 'error', message?: string) => {
      if (isEndingRef.current) return;
      isEndingRef.current = true;

      connectionMonitor.current.stop();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      setPhase('ending');

      try {
        await StreamService.disconnectStreamClient();
      } catch (error) {
        console.warn('Failed to disconnect Stream client', error);
      }

      let coinsSpent = 0;
      if (callStartedRef.current && user?.authUser) {
        try {
          const result = await callManager.endCall(user.authUser.$id);
          coinsSpent = result.coinsSpent;
          if (!result.success) {
            showWarning('Call ended, but billing confirmation failed.');
          }
        } catch (billingError) {
          console.error('Failed to finalize call billing', billingError);
          showWarning('Call ended, but coins may not have been deducted correctly.');
        }
      }

      switch (reason) {
        case 'timeout':
          showError('Call ended: Out of coins');
          break;
        case 'connection':
          showError('Call ended: Connection lost');
          break;
        case 'remote':
          showWarning('Host ended the call.');
          break;
        case 'user':
          if (coinsSpent > 0) {
            showSuccess(`Call ended. ${coinsSpent} coins spent.`);
          } else {
            showSuccess('Call ended.');
          }
          break;
        case 'error':
          if (message) {
            showError(message);
          } else {
            showError('Call ended unexpectedly.');
          }
          break;
      }

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1200);
    },
    [router, showError, showSuccess, showWarning, user?.authUser]
  );

  const updateBillingState = useCallback(() => {
    const coinsRemaining = callManager.getCoinsRemaining();
    const currentPricing = pricingRef.current;
    const activeRate = isVideoEnabledRef.current
      ? currentPricing.videoCostPerMin
      : currentPricing.audioCostPerMin;

    const secondsRemaining =
      activeRate > 0 ? Math.floor((coinsRemaining / activeRate) * 60) : 0;

    if (secondsRemaining <= currentPricing.warningThreshold && secondsRemaining > 0) {
      setIsLowTime(true);
    } else if (secondsRemaining > currentPricing.warningThreshold) {
      setIsLowTime(false);
    }

    setRemainingSeconds(Math.max(0, secondsRemaining));

    if (callStartedRef.current) {
      callManager
        .syncIncrementalBilling()
        .then(({ coinsDeducted }) => {
          if (coinsDeducted > 0) {
            walletBalanceRef.current = Math.max(0, walletBalanceRef.current - coinsDeducted);
          }
          billingSyncFailedRef.current = false;
        })
        .catch((error) => {
          if (!billingSyncFailedRef.current) {
            console.error('Failed to sync in-call billing', error);
          }
          billingSyncFailedRef.current = true;
        });
    }

    if (coinsRemaining <= 0.01 && callStartedRef.current && !isEndingRef.current) {
      finalizeCall('timeout');
    }
  }, [finalizeCall]);

  const startBillingLoop = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    updateBillingState();
    countdownIntervalRef.current = setInterval(() => {
      updateBillingState();
    }, 1000) as NodeJS.Timeout;
  }, [updateBillingState]);

  useEffect(() => {
    isVideoEnabledRef.current = currentCallType === 'video';
  }, [currentCallType]);

  useEffect(() => {
    pricingRef.current = pricing;
    connectionMonitor.current.updateTimeout(pricing.reconnectionTimeout);
  }, [pricing]);

  useEffect(() => {
    if (callStartedRef.current) {
      updateBillingState();
    }
  }, [currentCallType, updateBillingState]);

  useEffect(() => {
    let mounted = true;

    StreamService.loadUIComponents()
      .then((components) => {
        if (mounted) {
          setUiComponents(components);
        }
      })
      .catch((error) => {
        console.error('Failed to load Stream components', error);
        if (mounted) {
          const message =
            'Video calling components could not be loaded. Please ensure native dependencies are installed.';
          setInitializationError(message);
          setPhase('error');
          showError(message);
          setTimeout(() => router.replace('/(tabs)'), 1500);
        }
      });

    return () => {
      mounted = false;
    };
  }, [router, showError]);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    if (initializationError) {
      return;
    }

    if (!user?.authUser) {
      return;
    }

    if (!hostId) {
      const message = 'Missing host information for this call.';
      setInitializationError(message);
      setPhase('error');
      showError(message);
      setTimeout(() => router.replace('/(tabs)'), 1200);
      return;
    }

    hasStartedRef.current = true;
    let mounted = true;
    const monitor = connectionMonitor.current;

    const initializeCall = async () => {
      try {
        setPhase('initializing');

        const validation = await callManager.validateCall(
          user.authUser.$id,
          hostId,
          initialCallType === 'video'
        );

        if (!mounted) {
          return;
        }

        if (!validation.valid) {
          const message = validation.error || 'Unable to start call. Please try again later.';
          setInitializationError(message);
          setPhase('error');
          showError(message);
          setTimeout(() => router.replace('/(tabs)'), 1500);
          return;
        }

        if (validation.pricing) {
          pricingRef.current = validation.pricing;
          setPricing(validation.pricing);
        }

        if (typeof validation.walletBalance === 'number') {
          walletBalanceRef.current = validation.walletBalance;
        } else if (typeof user.userProfile?.walletBalance === 'number') {
          walletBalanceRef.current = user.userProfile.walletBalance;
        }

        const initialRateForDuration =
          initialCallType === 'video'
            ? pricingRef.current.videoCostPerMin
            : pricingRef.current.audioCostPerMin;

        const maxDurationSeconds =
          typeof validation.maxDuration === 'number'
            ? validation.maxDuration
            : calculateMaxDuration(
                walletBalanceRef.current,
                initialRateForDuration,
                pricingRef.current.warningThreshold
              ).maxDurationSeconds;

        setRemainingSeconds(maxDurationSeconds);
        setIsLowTime(
          maxDurationSeconds > 0 && maxDurationSeconds <= pricingRef.current.warningThreshold
        );

        const sessionResult = await StreamService.startCallSession({
          callId: callIdRef.current,
          userId: user.authUser.$id,
          userName: user.userProfile?.name || user.authUser.name || 'User',
          userImage: undefined,
          hostId,
          hostName: hostDisplayName,
          hostImage: hostImage,
          isVideo: initialCallType === 'video',
        });

        if (!mounted) {
          await StreamService.disconnectStreamClient().catch(() => {});
          return;
        }

        setSession(sessionResult);

        const startResult = await callManager.startCall(
          user.authUser.$id,
          hostId,
          callIdRef.current,
          initialCallType === 'video'
        );

        if (!startResult.success) {
          throw new Error(startResult.error || 'Failed to register call.');
        }

        callStartedRef.current = true;
        setIsMuted(false);
        wasDisconnectedRef.current = false;
        startBillingLoop();

        monitor.start((status) => {
          setConnectionState(status);
          setPhase((previous) => {
            if (!status.isConnected) {
              return 'reconnecting';
            }
            if (previous === 'reconnecting') {
              return 'active';
            }
            return previous;
          });

          if (!status.isConnected) {
            wasDisconnectedRef.current = true;
            if (status.reconnectTimeRemaining === 0) {
              finalizeCall('connection');
            }
            return;
          }

          if (wasDisconnectedRef.current) {
            wasDisconnectedRef.current = false;
            StreamService.reconnectCurrentCall()
              .then(() => {
                updateBillingState();
              })
              .catch((reconnectError) => {
                console.error('Failed to restore call after reconnection', reconnectError);
                finalizeCall('error', 'Unable to restore the call after a disconnect.');
              });
          }
        });

        setPhase('active');
      } catch (error) {
        console.error('Failed to start call', error);
        const parsed = parseError(error);
        setInitializationError(parsed.message);
        setPhase('error');
        showError(parsed.message);
        await StreamService.disconnectStreamClient().catch(() => {});
        setTimeout(() => router.replace('/(tabs)'), 1500);
      }
    };

    initializeCall();

    return () => {
      mounted = false;
      monitor.stop();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      StreamService.disconnectStreamClient().catch(() => {});
    };
  }, [
    finalizeCall,
    hostDisplayName,
    hostId,
    hostImage,
    initialCallType,
    initializationError,
    router,
    showError,
    startBillingLoop,
    updateBillingState,
    user?.authUser,
    user?.userProfile?.name,
    user?.userProfile?.walletBalance,
  ]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const unsubscribe = session.call.on('call.ended', () => {
      finalizeCall('remote');
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [session, finalizeCall]);

  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    try {
      await StreamService.setMicrophoneEnabled(!nextMuted);
    } catch (error) {
      setIsMuted(!nextMuted);
      const parsed = parseError(error);
      showError(parsed.message);
    }
  };

  const handleToggleVideo = async () => {
    const previousType = currentCallType;
    const nextType: 'audio' | 'video' = previousType === 'video' ? 'audio' : 'video';
    setCurrentCallType(nextType);

    try {
      await StreamService.setCameraEnabled(nextType === 'video');
      if (callStartedRef.current) {
        await callManager.switchCallType(nextType === 'video');
        updateBillingState();
      }
    } catch (error) {
      setCurrentCallType(previousType);
      const parsed = parseError(error);
      showError(parsed.message);
    }
  };

  const handleFlipCamera = async () => {
    if (currentCallType !== 'video') {
      showInfo('Enable video to flip the camera.');
      return;
    }

    try {
      await StreamService.flipCamera();
    } catch (error) {
      const parsed = parseError(error);
      showError(parsed.message);
    }
  };

  const handleEndCall = () => {
    Alert.alert('End Call', 'Are you sure you want to end this call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: () => finalizeCall('user'),
      },
    ]);
  };

  const handleRecharge = () => {
    setShowRechargeSheet(true);
  };

  const handleRechargeSuccess = (coins: number) => {
    walletBalanceRef.current += coins;
    callManager.addCoins(coins);
    setIsLowTime(false);
    updateBillingState();
    showSuccess(`${coins} coins added! Call extended.`);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.max(0, totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (phase === 'error' && initializationError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Unable to start call</Text>
          <Text style={styles.errorMessage}>{initializationError}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
          >
            <Text style={styles.errorButtonText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const StreamVideoComponent = uiComponents?.StreamVideo;
  const StreamCallComponent = uiComponents?.StreamCall;
  const StreamThemeComponent = uiComponents?.StreamTheme;
  const CallContentComponent = uiComponents?.CallContent;

  return (
    <SafeAreaView style={styles.container}>
      <InCallRechargeSheet
        visible={showRechargeSheet}
        onClose={() => setShowRechargeSheet(false)}
        onSuccess={handleRechargeSuccess}
      />

      <View style={styles.mediaContainer}>
        {session && StreamVideoComponent && StreamCallComponent && StreamThemeComponent && CallContentComponent ? (
          <StreamVideoComponent client={session.client}>
            <StreamCallComponent call={session.call}>
              <StreamThemeComponent>
                <CallContentComponent CallControls={null} />
              </StreamThemeComponent>
            </StreamCallComponent>
          </StreamVideoComponent>
        ) : null}

        {showAudioPlaceholder && (
          <ImageBackground
            source={{ uri: hostImage }}
            style={styles.audioBackground}
            blurRadius={currentCallType === 'audio' ? 18 : 8}
          >
            <View style={styles.audioOverlay} pointerEvents="none">
              <Image source={{ uri: hostImage }} style={styles.audioImage} />
              <Text style={styles.audioLabel}>{hostDisplayName}</Text>
              <Text style={styles.audioSubtitle}>
                {session ? (currentCallType === 'audio' ? 'Audio call in progress' : 'Connecting...') : 'Connecting...'}
              </Text>
            </View>
          </ImageBackground>
        )}

        {phase === 'reconnecting' && (
          <View style={styles.reconnectionOverlay}>
            <View style={styles.reconnectionCard}>
              <Ionicons name="cloud-offline" size={42} color={Colors.warning} />
              <Text style={styles.reconnectionTitle}>Connection lost</Text>
              <Text style={styles.reconnectionText}>
                Reconnecting... {connectionState.reconnectTimeRemaining}s
              </Text>
              <Text style={styles.reconnectionHint}>
                Call will end if the network doesn’t recover.
              </Text>
            </View>
          </View>
        )}

        {phase === 'initializing' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.loadingText}>Connecting to call...</Text>
          </View>
        )}
      </View>

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View
            style={[
              styles.countdownContainer,
              isLowTime && styles.countdownContainerWarning,
            ]}
          >
            <View style={[styles.recordingDot, isLowTime && styles.recordingDotWarning]} />
            <Text
              style={[
                styles.countdownText,
                isLowTime && styles.countdownTextWarning,
              ]}
            >
              {formatTime(remainingSeconds)}
            </Text>
            <Text style={styles.countdownLabel}>remaining</Text>
          </View>

          <Text style={styles.hostName}>{hostDisplayName}</Text>

          <View style={styles.rateInfo}>
            <Text style={styles.rateText}>
              💰 {currentRate} coins/min • {currentCallType.toUpperCase()}
            </Text>
          </View>

          {isLowTime && (
            <View style={styles.warningBadge}>
              <Ionicons name="warning" size={16} color={Colors.warning} />
              <Text style={styles.warningText}>Low balance! Add coins to continue</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPanel}>
          {isLowTime && (
            <TouchableOpacity
              style={styles.rechargeButton}
              onPress={handleRecharge}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet" size={18} color={Colors.background} />
              <Text style={styles.rechargeButtonText}>Add Coins</Text>
            </TouchableOpacity>
          )}

          <View style={styles.controlPanel}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={handleToggleMute}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={22}
                color={Colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                currentCallType === 'video' && styles.controlButtonActive,
              ]}
              onPress={handleToggleVideo}
              activeOpacity={0.8}
            >
              <Ionicons
                name={currentCallType === 'video' ? 'videocam' : 'videocam-outline'}
                size={22}
                color={Colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleFlipCamera}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-reverse" size={22} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endCallButton}
              onPress={handleEndCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  audioBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioOverlay: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  audioImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: Colors.border,
  },
  audioLabel: {
    marginTop: 12,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  audioSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  topBar: {
    alignItems: 'center',
    gap: 12,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  countdownContainerWarning: {
    backgroundColor: 'rgba(255,107,107,0.25)',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  recordingDotWarning: {
    backgroundColor: Colors.error,
  },
  countdownText: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.white,
  },
  countdownTextWarning: {
    color: Colors.error,
  },
  countdownLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  hostName: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  rateInfo: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  rateText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,184,0,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  warningText: {
    fontSize: FontSizes.sm,
    color: Colors.warning,
    fontWeight: '600',
  },
  bottomPanel: {
    alignItems: 'center',
    gap: 16,
  },
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
  },
  rechargeButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.background,
  },
  controlPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  controlButtonActive: {
    backgroundColor: Colors.primary,
  },
  endCallButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.error,
  },
  reconnectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 24,
  },
  reconnectionCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
  },
  reconnectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  reconnectionText: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
  },
  reconnectionHint: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 12,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  errorMessage: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  errorButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.white,
  },
});
