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

export default function HostCallingScreen() {
  const router = useRouter();
  const { callerName, callerPicture, isVideo, ratePerMin } = useLocalSearchParams();
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFlipped, setCameraFlipped] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [currentCallType, setCurrentCallType] = useState<'audio' | 'video'>(
    isVideo === '1' ? 'video' : 'audio'
  );
  const [showUpgradeRequest, setShowUpgradeRequest] = useState(false);
  const [upgradeTimeoutRemaining, setUpgradeTimeoutRemaining] = useState(15);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const earningsAnim = useRef(new Animated.Value(1)).current;
  const bannerSlideAnim = useRef(new Animated.Value(-200)).current;
  const prevEarnings = useRef(0);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Timer for call duration
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate earnings in real-time
  useEffect(() => {
    const rate = currentCallType === 'video' ? 60 : (parseFloat(ratePerMin as string) || 10);
    const currentEarnings = Math.floor((seconds / 60) * rate * 10) / 10; // Round to 1 decimal

    if (currentEarnings !== prevEarnings.current) {
      setEarnings(currentEarnings);
      prevEarnings.current = currentEarnings;

      // Animate the earnings counter when it increases
      Animated.sequence([
        Animated.timing(earningsAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(earningsAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [seconds, ratePerMin, currentCallType, earningsAnim]);

  // Simulate receiving an upgrade request after 10 seconds (for testing)
  useEffect(() => {
    if (currentCallType === 'audio') {
      const testTimer = setTimeout(() => {
        handleReceiveUpgradeRequest();
      }, 10000);
      return () => clearTimeout(testTimer);
    }
  }, [currentCallType]);

  // Upgrade request timeout countdown
  useEffect(() => {
    if (showUpgradeRequest && upgradeTimeoutRemaining > 0) {
      const countdownInterval = setInterval(() => {
        setUpgradeTimeoutRemaining((prev) => {
          if (prev <= 1) {
            handleUpgradeTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [showUpgradeRequest, upgradeTimeoutRemaining]);

  const handleReceiveUpgradeRequest = () => {
    setShowUpgradeRequest(true);
    setUpgradeTimeoutRemaining(15);

    // Slide in animation
    Animated.spring(bannerSlideAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleAcceptUpgrade = () => {
    // Slide out animation
    Animated.timing(bannerSlideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowUpgradeRequest(false);
      setCurrentCallType('video');
      Alert.alert('Upgrade Accepted', 'Switched to video call!');
    });
  };

  const handleRejectUpgrade = () => {
    // Slide out animation
    Animated.timing(bannerSlideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowUpgradeRequest(false);
    });
  };

  const handleUpgradeTimeout = () => {
    // Fade out animation
    Animated.timing(bannerSlideAnim, {
      toValue: -200,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowUpgradeRequest(false);
    });
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      `You earned 💰 ${earnings.toFixed(1)} coins from this call!`,
      [
        {
          text: 'End Call',
          onPress: () => router.replace('/host-dashboard'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: callerPicture as string }}
        style={styles.videoBackground}
        blurRadius={isVideo === '1' ? 0 : 20}
      >
        <View style={styles.overlay}>
          {/* Upgrade Request Banner */}
          {showUpgradeRequest && (
            <Animated.View
              style={[
                styles.upgradeRequestBanner,
                { transform: [{ translateY: bannerSlideAnim }] },
              ]}
            >
              <View style={styles.upgradeRequestContent}>
                <View style={styles.upgradeRequestHeader}>
                  <Ionicons name="videocam" size={24} color={Colors.accent} />
                  <View style={styles.upgradeRequestTextContainer}>
                    <Text style={styles.upgradeRequestTitle}>Video Call Request</Text>
                    <Text style={styles.upgradeRequestSubtitle}>
                      {callerName} wants to switch to video
                    </Text>
                  </View>
                  <View style={styles.upgradeTimeoutBadge}>
                    <Text style={styles.upgradeTimeoutText}>{upgradeTimeoutRemaining}s</Text>
                  </View>
                </View>
                <View style={styles.upgradeRequestActions}>
                  <TouchableOpacity
                    style={[styles.upgradeActionButton, styles.upgradeRejectButton]}
                    onPress={handleRejectUpgrade}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.white} />
                    <Text style={styles.upgradeActionText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.upgradeActionButton, styles.upgradeAcceptButton]}
                    onPress={handleAcceptUpgrade}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={styles.upgradeActionText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Top Info Bar */}
          <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
            <View style={styles.callerInfo}>
              <Image
                source={{ uri: callerPicture as string }}
                style={styles.callerThumbnail}
              />
              <View>
                <Text style={styles.callerName}>{callerName}</Text>
                <View style={styles.timerContainer}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                </View>
              </View>
            </View>

            {/* Real-time Earnings Counter */}
            <Animated.View
              style={[
                styles.earningsContainer,
                { transform: [{ scale: earningsAnim }] },
              ]}
            >
              <Ionicons name="flash" size={20} color={Colors.secondary} />
              <Text style={styles.earningsText}>💰 {earnings.toFixed(1)}</Text>
            </Animated.View>
          </Animated.View>

          {/* Middle Section - Rate Info */}
          <Animated.View style={[styles.rateInfo, { opacity: fadeAnim }]}>
            <View style={styles.rateCard}>
              <Ionicons name="trending-up" size={24} color={Colors.secondary} />
              <Text style={styles.rateText}>Earning {ratePerMin}/min</Text>
            </View>
          </Animated.View>

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
                color={isMuted ? Colors.error : Colors.white}
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
                  color={cameraFlipped ? Colors.secondary : Colors.white}
                />
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
    backgroundColor: Colors.background,
  },
  videoBackground: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
  },
  topBar: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  callerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  callerThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: Colors.surface,
  },
  callerName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginRight: 6,
  },
  timerText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  earningsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 209, 197, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  earningsText: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: Colors.white,
  },
  rateInfo: {
    alignItems: 'center',
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  rateText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
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
    borderColor: Colors.error,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeRequestBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  upgradeRequestContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    marginHorizontal: 16,
    marginTop: 48,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  upgradeRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  upgradeRequestTextContainer: {
    flex: 1,
  },
  upgradeRequestTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  upgradeRequestSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  upgradeTimeoutBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  upgradeTimeoutText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  upgradeRequestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  upgradeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  upgradeRejectButton: {
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    borderWidth: 2,
    borderColor: Colors.text.secondary,
  },
  upgradeAcceptButton: {
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  upgradeActionText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.white,
  },
});
