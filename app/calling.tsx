import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  ImageBackground,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import { calculateMaxDuration, calculateCoinsSpent, ConnectionMonitor } from '@/services/calling';
import InCallRechargeSheet from '@/components/InCallRechargeSheet';

type CallState = 'ringing' | 'inCall' | 'reconnecting' | 'ending';
type ConnectionState = {
  isConnected: boolean;
  reconnectTimeRemaining: number;
};

export default function CallingScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { showError, showSuccess } = useToast();
  const { hostName, hostPicture, isVideo, costPerMin } = useLocalSearchParams();

  const [callState, setCallState] = useState<CallState>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFlipped, setCameraFlipped] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0); // Changed: countdown timer
  const [isLowTime, setIsLowTime] = useState(false);
  const [showRechargeSheet, setShowRechargeSheet] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: true,
    reconnectTimeRemaining: 0,
  });
  const [currentCallType, setCurrentCallType] = useState<'audio' | 'video'>(
    isVideo === '1' ? 'video' : 'audio'
  );
  const [upgradeRequestState, setUpgradeRequestState] = useState<
    'idle' | 'sending' | 'pending'
  >('idle');
  const [upgradeAttempts, setUpgradeAttempts] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const connectionMonitor = useRef(new ConnectionMonitor());
  const costPerMinNum = parseInt(costPerMin as string, 10) || 10;

  // Initialize countdown timer based on wallet balance
  useEffect(() => {
    if (user?.userProfile) {
      const balance = user.userProfile.walletBalance || 0;
      const currentCost = currentCallType === 'video' ? 60 : costPerMinNum;
      const duration = calculateMaxDuration(balance, currentCost);
      setRemainingSeconds(duration.maxDurationSeconds);
    }
  }, [user?.userProfile, costPerMinNum, currentCallType]);

  // Auto-transition from ringing to in-call after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('inCall');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Start connection monitoring
      connectionMonitor.current.start((status) => {
        setConnectionState(status);
        if (!status.isConnected) {
          setCallState('reconnecting');
        } else if (callState === 'reconnecting') {
          setCallState('inCall');
        }
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
      connectionMonitor.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fadeAnim]);

  // Reverse countdown timer with auto-termination
  useEffect(() => {
    if (callState === 'inCall' || callState === 'reconnecting') {
      const interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newRemaining = prev - 1;

          // Check if time is running out (less than 60 seconds)
          if (newRemaining <= 60 && newRemaining > 0) {
            setIsLowTime(true);
          }

          // Auto-terminate when timer reaches 00:00
          if (newRemaining <= 0) {
            handleTimeExpired();
            return 0;
          }

          return newRemaining;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState]);

  // Connection timeout - auto end call
  useEffect(() => {
    if (!connectionState.isConnected && connectionState.reconnectTimeRemaining === 0) {
      handleConnectionTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  // Pulsing animation for ringing state
  useEffect(() => {
    if (callState === 'ringing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [callState, pulseAnim]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeExpired = () => {
    setCallState('ending');
    connectionMonitor.current.stop();
    showError('Call ended: Out of coins');
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleConnectionTimeout = () => {
    setCallState('ending');
    connectionMonitor.current.stop();
    showError('Call ended: Connection lost');
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleEndCall = () => {
    Alert.alert('End Call', 'Are you sure you want to end this call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: () => {
          setCallState('ending');
          connectionMonitor.current.stop();

          // Calculate elapsed time and coins spent
          const initialBalance = user?.userProfile?.walletBalance || 0;
          const initialCost = isVideo === '1' ? 60 : costPerMinNum;
          const initialDuration = calculateMaxDuration(initialBalance, initialCost).maxDurationSeconds;
          const elapsedSeconds = initialDuration - remainingSeconds;
          const currentCost = currentCallType === 'video' ? 60 : costPerMinNum;
          const coinsSpent = calculateCoinsSpent(elapsedSeconds, currentCost);
          showSuccess(`Call ended. ${coinsSpent} coins spent.`);

          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1000);
        },
      },
    ]);
  };

  const handleRecharge = () => {
    setShowRechargeSheet(true);
  };

  const handleRechargeSuccess = (amount: number) => {
    // Extend call duration based on current call type
    const currentCost = currentCallType === 'video' ? 60 : costPerMinNum;
    const additionalSeconds = Math.floor((amount / currentCost) * 60);
    setRemainingSeconds((prev) => prev + additionalSeconds);
    setIsLowTime(false);
    showSuccess(`${amount} coins added! Call extended.`);
  };

  const handleUpgradeToVideo = () => {
    if (upgradeAttempts >= 3) {
      showError('Maximum upgrade requests reached for this call');
      return;
    }

    setUpgradeRequestState('sending');
    setUpgradeAttempts((prev) => prev + 1);

    // Simulate sending request to host
    setTimeout(() => {
      setUpgradeRequestState('pending');
      showSuccess('Upgrade request sent to host');

      // Simulate host response after 5 seconds (randomly accept or reject for testing)
      setTimeout(() => {
        const isAccepted = Math.random() > 0.3; // 70% chance of acceptance
        if (isAccepted) {
          handleUpgradeAccepted();
        } else {
          handleUpgradeRejected();
        }
      }, 5000);
    }, 500);
  };

  const handleUpgradeAccepted = () => {
    const currentRemaining = remainingSeconds;

    // Change call type to video
    setCurrentCallType('video');
    setUpgradeRequestState('idle');

    // Recalculate and animate timer
    recalculateTimerForVideoUpgrade(currentRemaining);

    showSuccess('🎥 Upgraded to video call!');
  };

  const handleUpgradeRejected = () => {
    setUpgradeRequestState('idle');

    // Show rejection notification
    showError('Host declined video upgrade');

    // Check if max attempts reached
    if (upgradeAttempts >= 3) {
      showError('Maximum upgrade requests reached');
    }
  };

  const recalculateTimerForVideoUpgrade = (currentRemaining: number) => {
    // Calculate remaining coins based on audio rate
    const elapsedAudioSeconds =
      calculateMaxDuration(user?.userProfile?.walletBalance || 0, costPerMinNum).maxDurationSeconds - currentRemaining;
    const coinsSpent = calculateCoinsSpent(elapsedAudioSeconds, costPerMinNum);
    const remainingCoins = (user?.userProfile?.walletBalance || 0) - coinsSpent;

    // Calculate new duration at video rate (60 coins/min)
    const newDuration = calculateMaxDuration(remainingCoins, 60);

    // Animate timer spin-down
    const steps = 30; // Number of animation frames
    const decrement = (currentRemaining - newDuration.maxDurationSeconds) / steps;
    let currentStep = 0;

    const animationInterval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(animationInterval);
        setRemainingSeconds(newDuration.maxDurationSeconds);
      } else {
        setRemainingSeconds(Math.floor(currentRemaining - (decrement * currentStep)));
      }
    }, 30); // 30ms per frame = ~1 second total animation
  };

  if (callState === 'ringing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.ringingContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Image
              source={{ uri: hostPicture as string }}
              style={styles.ringingProfilePicture}
            />
          </Animated.View>
          <Text style={styles.ringingName}>{hostName}</Text>
          <Text style={styles.ringingStatus}>Connecting...</Text>
          <View style={styles.ringingDots}>
            <View style={[styles.dot, styles.dotAnimated]} />
            <View style={[styles.dot, styles.dotAnimated]} />
            <View style={[styles.dot, styles.dotAnimated]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <InCallRechargeSheet
        visible={showRechargeSheet}
        onClose={() => setShowRechargeSheet(false)}
        onSuccess={handleRechargeSuccess}
      />

      <ImageBackground
        source={{ uri: hostPicture as string }}
        style={styles.videoBackground}
        blurRadius={isVideo === '1' ? 0 : 20}
      >
        <View style={styles.overlay}>
          {/* Connection Overlay */}
          {connectionState.isConnected === false && (
            <View style={styles.reconnectionOverlay}>
              <View style={styles.reconnectionCard}>
                <Ionicons name="cloud-offline" size={48} color={Colors.warning} />
                <Text style={styles.reconnectionTitle}>Connection Lost</Text>
                <Text style={styles.reconnectionText}>
                  Reconnecting... {connectionState.reconnectTimeRemaining}s
                </Text>
                <Text style={styles.reconnectionHint}>
                  Call will end if not reconnected in time
                </Text>
              </View>
            </View>
          )}

          {/* Top Info Bar */}
          <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
            {/* Countdown Timer - Central Focus */}
            <Animated.View
              style={[
                styles.countdownContainer,
                isLowTime && styles.countdownContainerWarning,
                { transform: [{ scale: timerAnim }] },
              ]}
            >
              <View style={[styles.recordingDot, isLowTime && styles.recordingDotWarning]} />
              <Text style={[styles.countdownText, isLowTime && styles.countdownTextWarning]}>
                {formatTime(remainingSeconds)}
              </Text>
              <Text style={styles.countdownLabel}>remaining</Text>
            </Animated.View>

            <Text style={styles.hostNameInCall}>{hostName}</Text>

            {/* Rate Information */}
            <View style={styles.rateInfo}>
              <Text style={styles.costText}>
                {currentCallType === 'video' ? '60' : costPerMin} coins/min • {currentCallType.toUpperCase()}
              </Text>
            </View>

            {/* Low Time Warning */}
            {isLowTime && (
              <View style={styles.warningBadge}>
                <Ionicons name="warning" size={16} color={Colors.warning} />
                <Text style={styles.warningText}>Low balance! Add coins to continue</Text>
              </View>
            )}
          </Animated.View>

          {/* Add Coins Button (when low time) */}
          {isLowTime && (
            <Animated.View style={[styles.rechargeButtonContainer, { opacity: fadeAnim }]}>
              <TouchableOpacity
                style={styles.rechargeButton}
                onPress={handleRecharge}
                activeOpacity={0.8}
              >
                <Ionicons name="wallet" size={20} color={Colors.white} />
                <Text style={styles.rechargeButtonText}>Add Coins</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Control Panel */}
          <Animated.View style={[styles.controlPanel, { opacity: fadeAnim }]}>
            {/* Mute Button */}
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={() => setIsMuted(!isMuted)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={28}
                color={isMuted ? Colors.secondary : Colors.white}
              />
            </TouchableOpacity>

            {/* Switch to Video Button (only for audio calls) */}
            {currentCallType === 'audio' && (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  styles.upgradeButton,
                  (upgradeRequestState !== 'idle' || upgradeAttempts >= 3) && styles.upgradeButtonDisabled,
                ]}
                onPress={handleUpgradeToVideo}
                disabled={upgradeRequestState !== 'idle' || upgradeAttempts >= 3}
                activeOpacity={0.7}
              >
                {upgradeRequestState === 'sending' || upgradeRequestState === 'pending' ? (
                  <View style={styles.upgradeButtonContent}>
                    <Ionicons name="hourglass" size={24} color={Colors.white} />
                    <Text style={styles.upgradeButtonLabel}>
                      {upgradeRequestState === 'sending' ? 'Sending...' : 'Pending'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.upgradeButtonContent}>
                    <Ionicons
                      name="videocam"
                      size={24}
                      color={upgradeAttempts >= 3 ? Colors.text.secondary : Colors.accent}
                    />
                    <Ionicons
                      name="add-circle"
                      size={16}
                      color={upgradeAttempts >= 3 ? Colors.text.secondary : Colors.accent}
                      style={styles.upgradeIcon}
                    />
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* End Call Button */}
            <TouchableOpacity
              style={styles.endCallButton}
              onPress={handleEndCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={32} color={Colors.white} />
            </TouchableOpacity>

            {/* Camera Switch Button (only for video calls) */}
            {currentCallType === 'video' && (
              <TouchableOpacity
                style={[styles.controlButton, cameraFlipped && styles.controlButtonActive]}
                onPress={() => setCameraFlipped(!cameraFlipped)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="camera-reverse"
                  size={28}
                  color={cameraFlipped ? Colors.accent : Colors.white}
                />
              </TouchableOpacity>
            )}

            {/* Add Coins Button */}
            {!isLowTime && (
              <TouchableOpacity
                style={[styles.controlButton, styles.addCoinsButton]}
                onPress={handleRecharge}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={28} color={Colors.white} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  ringingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  ringingProfilePicture: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.border,
    borderWidth: 4,
    borderColor: Colors.accent,
    marginBottom: 32,
  },
  ringingName: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  ringingStatus: {
    fontSize: FontSizes.lg,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 24,
  },
  ringingDots: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  dotAnimated: {
    opacity: 0.6,
  },
  videoBackground: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
  },
  reconnectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  reconnectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  reconnectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  reconnectionText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 8,
  },
  reconnectionHint: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  topBar: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  countdownContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  countdownContainerWarning: {
    backgroundColor: 'rgba(255, 184, 0, 0.25)',
    borderColor: Colors.warning,
    shadowColor: Colors.warning,
  },
  countdownText: {
    fontSize: FontSizes['4xl'],
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countdownTextWarning: {
    color: Colors.warning,
  },
  countdownLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.7,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
    marginBottom: 8,
  },
  recordingDotWarning: {
    backgroundColor: Colors.warning,
  },
  hostNameInCall: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  rateInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
  },
  costText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.9,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  warningText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.warning,
  },
  rechargeButtonContainer: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  rechargeButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.white,
  },
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 48,
    gap: 24,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: Colors.secondary,
  },
  addCoinsButton: {
    backgroundColor: 'rgba(167, 125, 255, 0.3)',
    borderColor: Colors.primary,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeButton: {
    backgroundColor: 'rgba(167, 125, 255, 0.25)',
    borderColor: Colors.accent,
    borderWidth: 2,
    minWidth: 80,
    height: 60,
    paddingHorizontal: 12,
  },
  upgradeButtonDisabled: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderColor: Colors.text.secondary,
    opacity: 0.5,
  },
  upgradeButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 4,
  },
  upgradeIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});
