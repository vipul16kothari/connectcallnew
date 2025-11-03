import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { MOCK_HOSTS } from '@/data/mockData';
import { Ionicons } from '@expo/vector-icons';

export default function HostProfileScreen() {
  const router = useRouter();
  const { hostId } = useLocalSearchParams();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const host = MOCK_HOSTS.find((h) => h.id === hostId);

  useEffect(() => {
    // Pulsing animation for video call button
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
  }, [pulseAnim]);

  if (!host) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Host not found</Text>
      </SafeAreaView>
    );
  }

  const handleCall = (isVideo: boolean) => {
    router.push({
      pathname: '/calling',
      params: {
        hostId: host.id,
        hostName: host.name,
        hostPicture: host.profilePicture,
        isVideo: isVideo ? '1' : '0',
        costPerMin: isVideo ? host.videoCostPerMin : host.audioCostPerMin,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: host.profilePicture }}
            style={styles.profilePicture}
          />
          {host.isOnline && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          )}
        </View>

        {/* Host Info */}
        <View style={styles.infoSection}>
          <Text style={styles.hostName}>{host.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>★ {host.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.languagesContainer}>
            <Ionicons name="globe-outline" size={18} color={Colors.text.secondary} />
            <Text style={styles.languages}>{host.languages.join(', ')}</Text>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{host.bio}</Text>
        </View>
      </ScrollView>

      {/* Call Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.audioButton}
          onPress={() => handleCall(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={24} color={Colors.white} />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Audio Call</Text>
            <Text style={styles.buttonSubtitle}>{host.audioCostPerMin} coins/min</Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.videoButton}
            onPress={() => handleCall(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam" size={24} color={Colors.white} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Video Call</Text>
              <Text style={styles.buttonSubtitle}>{host.videoCostPerMin} coins/min</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 24,
  },
  profilePicture: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.border,
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: 6,
  },
  onlineText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  hostName: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  ratingContainer: {
    marginBottom: 12,
  },
  rating: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: '#FFA500',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languages: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    marginLeft: 6,
  },
  bioSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  bioText: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonTextContainer: {
    marginLeft: 12,
  },
  buttonTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.white,
    opacity: 0.9,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 100,
  },
});
