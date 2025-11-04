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

export default function CallingScreen() {
  const router = useRouter();
  const { hostName, hostPicture, isVideo, costPerMin } = useLocalSearchParams();
  const [callState, setCallState] = useState<'ringing' | 'inCall'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFlipped, setCameraFlipped] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-transition from ringing to in-call after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('inCall');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  // Timer for call duration
  useEffect(() => {
    if (callState === 'inCall') {
      const interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callState]);

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

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
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
      <ImageBackground
        source={{ uri: hostPicture as string }}
        style={styles.videoBackground}
        blurRadius={isVideo === '1' ? 0 : 20}
      >
        <View style={styles.overlay}>
          {/* Top Info Bar */}
          <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
            <View style={styles.timerContainer}>
              <View style={styles.recordingDot} />
              <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            </View>
            <Text style={styles.hostNameInCall}>{hostName}</Text>
            <Text style={styles.costText}>{costPerMin} coins/min</Text>
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
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
    marginRight: 8,
  },
  timerText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
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
