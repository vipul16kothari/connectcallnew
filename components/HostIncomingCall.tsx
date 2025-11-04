import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
// import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type HostIncomingCallProps = {
  visible: boolean;
  callerName: string;
  callerPicture: string;
  isVideo: boolean;
  onAccept: () => void;
  onReject: () => void;
};

export default function HostIncomingCall({
  visible,
  callerName,
  callerPicture,
  isVideo,
  onAccept,
  onReject,
}: HostIncomingCallProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Pulsing animation for caller picture
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
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
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [visible, pulseAnim, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.callTypeContainer}>
            <Ionicons
              name={isVideo ? 'videocam' : 'call'}
              size={24}
              color={Colors.secondary}
            />
            <Text style={styles.callTypeText}>
              Incoming {isVideo ? 'Video' : 'Audio'} Call
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Image
              source={{ uri: callerPicture }}
              style={styles.callerPicture}
            />
          </Animated.View>

          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.subtitle}>is calling you...</Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="close" size={32} color={Colors.white} />
                <Text style={styles.buttonText}>Reject</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark" size={32} color={Colors.white} />
                <Text style={styles.buttonText}>Accept</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.earningsHint}>
            <Ionicons name="flash" size={20} color={Colors.secondary} />
            <Text style={styles.earningsHintText}>
              You&apos;ll earn 💰 10/min for this call
            </Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 48,
    gap: 8,
  },
  callTypeText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.secondary,
  },
  callerPicture: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.surface,
    borderWidth: 4,
    borderColor: Colors.secondary,
    marginBottom: 32,
  },
  callerName: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
    marginBottom: 64,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  button: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  acceptButton: {
    backgroundColor: Colors.secondary,
  },
  buttonContent: {
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.white,
  },
  earningsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  earningsHintText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
