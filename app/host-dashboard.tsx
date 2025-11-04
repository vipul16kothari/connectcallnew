import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import HostIncomingCall from '@/components/HostIncomingCall';

// Mock data
const MOCK_TODAY_EARNINGS = 450;
const MOCK_TOTAL_EARNINGS = 12850;

export default function HostDashboardScreen() {
  const router = useRouter();
  const [audioOnline, setAudioOnline] = useState(false);
  const [videoOnline, setVideoOnline] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (audioOnline || videoOnline) {
      // Pulsing animation when online
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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

      // Simulate incoming call after 10 seconds when online
      const timer = setTimeout(() => {
        setShowIncomingCall(true);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [audioOnline, videoOnline, pulseAnim]);

  const handleAcceptCall = () => {
    setShowIncomingCall(false);
    router.push({
      pathname: '/host-calling',
      params: {
        callerName: 'John Doe',
        callerPicture: 'https://i.pravatar.cc/300?img=12',
        isVideo: videoOnline ? '1' : '0',
        ratePerMin: '10',
      },
    });
  };

  const handleRejectCall = () => {
    setShowIncomingCall(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <HostIncomingCall
        visible={showIncomingCall}
        callerName="John Doe"
        callerPicture="https://i.pravatar.cc/300?img=12"
        isVideo={videoOnline}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>SuperHost Dashboard 🌟</Text>
          <Text style={styles.subtitle}>Manage your availability</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Earnings Summary */}
        <View style={styles.earningsSection}>
          <EarningsCard
            title="Today's Earnings"
            amount={MOCK_TODAY_EARNINGS}
            icon="today-outline"
            color={Colors.secondary}
          />
          <EarningsCard
            title="Total Earnings"
            amount={MOCK_TOTAL_EARNINGS}
            icon="wallet-outline"
            color={Colors.primary}
          />
        </View>

        {/* Online Status Section */}
        <View style={styles.onlineSection}>
          <Text style={styles.sectionTitle}>Availability Status</Text>
          <Text style={styles.sectionSubtitle}>
            Toggle to make yourself available for calls
          </Text>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <OnlineToggle
              label="Audio Calls"
              sublabel="Accept voice-only calls"
              icon="call"
              value={audioOnline}
              onValueChange={setAudioOnline}
            />
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <OnlineToggle
              label="Video Calls"
              sublabel="Accept video calls"
              icon="videocam"
              value={videoOnline}
              onValueChange={setVideoOnline}
            />
          </Animated.View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="call-outline"
              value="127"
              label="Total Calls"
            />
            <StatCard
              icon="time-outline"
              value="42h"
              label="Call Time"
            />
            <StatCard
              icon="star"
              value="4.9"
              label="Rating"
            />
            <StatCard
              icon="people-outline"
              value="89"
              label="Unique Callers"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={Colors.secondary} />
          <Text style={styles.infoText}>
            💡 Tip: Being online during peak hours (8 PM - 11 PM) can increase your earnings by up to 40%!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EarningsCard({
  title,
  amount,
  icon,
  color,
}: {
  title: string;
  amount: number;
  icon: any;
  color: string;
}) {
  return (
    <View style={[styles.earningsCard, { borderLeftColor: color }]}>
      <View style={styles.earningsHeader}>
        <View style={[styles.earningsIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.earningsTitle}>{title}</Text>
      </View>
      <Text style={styles.earningsAmount}>💰 {amount}</Text>
      <Text style={styles.earningsLabel}>coins</Text>
    </View>
  );
}

function OnlineToggle({
  label,
  sublabel,
  icon,
  value,
  onValueChange,
}: {
  label: string;
  sublabel: string;
  icon: any;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.toggleCard, value && styles.toggleCardActive]}>
      <View style={styles.toggleLeft}>
        <View style={[styles.toggleIcon, value && styles.toggleIconActive]}>
          <Ionicons name={icon} size={28} color={value ? Colors.white : Colors.text.light} />
        </View>
        <View style={styles.toggleText}>
          <Text style={[styles.toggleLabel, value && styles.toggleLabelActive]}>{label}</Text>
          <Text style={styles.toggleSublabel}>{sublabel}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.secondary }}
        thumbColor={Colors.white}
        ios_backgroundColor={Colors.border}
      />
    </View>
  );
}

function StatCard({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={24} color={Colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  earningsSection: {
    gap: 16,
    marginBottom: 32,
  },
  earningsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earningsTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  earningsAmount: {
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  earningsLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.light,
  },
  onlineSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  toggleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  toggleCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.surfaceLight,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toggleIconActive: {
    backgroundColor: Colors.secondary,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  toggleLabelActive: {
    color: Colors.text.primary,
  },
  toggleSublabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.light,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
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
