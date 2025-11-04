import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,

} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';


export default function HostVerificationScreen() {
  const router = useRouter();
  const { updateHostStatus } = useUser();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Auto-approve after 5 seconds
    const timer = setTimeout(async () => {
      // Stop spinning animation
      spinAnim.stopAnimation();

      // Success animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();

      // Update status to approved
      await updateHostStatus('approved');

      // Navigate to host dashboard after a brief pause
      setTimeout(() => {
        router.replace('/host-dashboard');
      }, 1500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [spinAnim, scaleAnim, updateHostStatus, router]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { rotate: spin },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Ionicons name="hourglass-outline" size={80} color={Colors.secondary} />
        </Animated.View>

        <Text style={styles.title}>Verification Pending</Text>
        <Text style={styles.subtitle}>
          We&apos;re reviewing your application. This usually takes less than 24 hours.
        </Text>

        <View style={styles.stepsContainer}>
          <StepItem
            icon="checkmark-circle"
            title="Application Submitted"
            description="Your application has been received"
            completed
          />
          <StepItem
            icon="shield-checkmark"
            title="Verification in Progress"
            description="We&apos;re reviewing your profile"
            active
          />
          <StepItem
            icon="star"
            title="Become a SuperHost"
            description="Start earning and connecting"
            upcoming
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            You&apos;ll receive a notification once your profile is approved. Hang tight!
          </Text>
        </View>
      </View>
    </View>
  );
}

function StepItem({
  icon,
  title,
  description,
  completed = false,
  active = false,
  upcoming = false,
}: {
  icon: any;
  title: string;
  description: string;
  completed?: boolean;
  active?: boolean;
  upcoming?: boolean;
}) {
  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepIcon,
          completed && styles.stepIconCompleted,
          active && styles.stepIconActive,
          upcoming && styles.stepIconUpcoming,
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={
            completed || active
              ? Colors.white
              : Colors.text.light
          }
        />
      </View>
      <View style={styles.stepContent}>
        <Text
          style={[
            styles.stepTitle,
            (completed || active) && styles.stepTitleActive,
          ]}
        >
          {title}
        </Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
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
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepIconCompleted: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  stepIconActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepIconUpcoming: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  stepTitleActive: {
    color: Colors.text.primary,
  },
  stepDescription: {
    fontSize: FontSizes.sm,
    color: Colors.text.light,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
