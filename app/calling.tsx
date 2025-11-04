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
  const [seconds, setSeconds] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const [isLowTime, setIsLowTime] = useState(false);
  const [showRechargeSheet, setShowRechargeSheet] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: true,
    reconnectTimeRemaining: 0,
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const connectionMonitor = useRef(new ConnectionMonitor());
  const costPerMinNum = parseInt(costPerMin as string, 10) || 10;

  // Initialize max duration on mount
  useEffect(() => {
    if (user?.userProfile) {
      const balance = user.userProfile.walletBalance || 0;
      const duration = calculateMaxDuration(balance, costPerMinNum);
      setMaxDuration(duration.maxDurationSeconds);
    }
  }, [user?.userProfile, costPerMinNum]);

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

  // Timer for call duration with auto-termination
  useEffect(() => {
    if (callState === 'inCall' || callState === 'reconnecting') {
      const interval = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;

          // Check if time is running out
          const remainingTime = maxDuration - newSeconds;
          if (remainingTime <= 60 && remainingTime > 0) {
            setIsLowTime(true);
          }

          // Auto-terminate if out of time
          if (newSeconds >= maxDuration) {
            handleTimeExpired();
            return prev;
          }

          return newSeconds;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState, maxDuration]);

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

  const getRemainingTime = () => {
    return maxDuration - seconds;
  };

  const formatRemainingTime = () => {
    const remaining = getRemainingTime();
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

          // Calculate coins spent
          const coinsSpent = calculateCoinsSpent(seconds, costPerMinNum);
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
    // Extend call duration
    const additionalSeconds = Math.floor((amount / costPerMinNum) * 60);
    setMaxDuration((prev) => prev + additionalSeconds);
    setIsLowTime(false);
    showSuccess(`${amount} coins added! Call extended.`);
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
            <View style={[styles.timerContainer, isLowTime && styles.timerContainerWarning]}>
              <View style={[styles.recordingDot, isLowTime && styles.recordingDotWarning]} />
              <Text style={[styles.timerText, isLowTime && styles.timerTextWarning]}>
                {formatTime(seconds)}
              </Text>
            </View>
            <Text style={styles.hostNameInCall}>{hostName}</Text>

            {/* Remaining Time Warning */}
            {isLowTime && (
              <View style={styles.warningBadge}>
                <Ionicons name="warning" size={16} color={Colors.warning} />
                <Text style={styles.warningText}>
                  {formatRemainingTime()} remaining
                </Text>
              </View>
            )}

            <Text style={styles.costText}>{costPerMin} coins/min</Text>
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

            {/* End Call Button */}
            <TouchableOpacity
              style={styles.endCallButton}
              onPress={handleEndCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={32} color={Colors.white} />
            </TouchableOpacity>

            {/* Camera Switch Button (only for video calls) */}
            {isVideo === '1' && (
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

            {/* Add Coins Button (alternative position) */}
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
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  timerContainerWarning: {
    backgroundColor: 'rgba(255, 184, 0, 0.3)',
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
    marginRight: 8,
  },
  recordingDotWarning: {
    backgroundColor: Colors.warning,
  },
  timerText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  timerTextWarning: {
    color: Colors.warning,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    gap: 6,
  },
  warningText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.warning,
  },
  hostNameInCall: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  costText: {
    fontSize: FontSizes.sm,
    color: Colors.white,
    opacity: 0.8,
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
});
