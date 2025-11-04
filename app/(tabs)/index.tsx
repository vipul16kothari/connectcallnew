import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { MOCK_HOSTS, INITIAL_WALLET_BALANCE, PROMO_BANNERS, PromoBanner } from '@/data/mockData';
import { Host } from '@/types/host';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import SuperHostBottomSheet from '@/components/SuperHostBottomSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 40;
const BANNER_SPACING = 16;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [walletBalance] = useState(INITIAL_WALLET_BALANCE);
  const [showSuperHostSheet, setShowSuperHostSheet] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;

  // Redirect to host dashboard if user is an approved host
  useEffect(() => {
    if (user?.userProfile?.isHost && user?.userProfile?.hostStatus === 'approved') {
      router.replace('/host-dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    // Floating animation for FAB
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(fabAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fabAnim]);

  useEffect(() => {
    // Show SuperHost sheet for female users who haven't applied or aren't hosts
    if (user?.userProfile?.gender === 'Female' && user?.userProfile?.hostStatus === 'none') {
      const timer = setTimeout(() => {
        setShowSuperHostSheet(true);
      }, 2000); // Show after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleRandomCall = () => {
    const randomHost = MOCK_HOSTS[Math.floor(Math.random() * MOCK_HOSTS.length)];
    const isVideo = Math.random() > 0.5;

    Alert.alert(
      'Random Call',
      `Connecting you with ${randomHost.name} for a ${isVideo ? 'video' : 'audio'} call...`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            router.push({
              pathname: '/calling',
              params: {
                hostId: randomHost.id,
                hostName: randomHost.name,
                hostPicture: randomHost.profilePicture,
                isVideo: isVideo ? '1' : '0',
                costPerMin: isVideo ? randomHost.videoCostPerMin : randomHost.audioCostPerMin,
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SuperHostBottomSheet
        visible={showSuperHostSheet}
        onClose={() => setShowSuperHostSheet(false)}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.subtitle}>Find your perfect conversation</Text>
          </View>
          <TouchableOpacity
            style={styles.walletButton}
            onPress={() => router.push('/wallet')}
            activeOpacity={0.7}
          >
            <Ionicons name="wallet" size={20} color={Colors.primary} />
            <Text style={styles.walletBalance}>{walletBalance}</Text>
          </TouchableOpacity>
        </View>

        {/* Promotional Banners */}
        <View style={styles.bannersContainer}>
          <Animated.FlatList
            data={PROMO_BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={BANNER_WIDTH + BANNER_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.bannersContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            renderItem={({ item }) => <BannerCard banner={item} />}
            keyExtractor={(item) => item.id}
          />

          {/* Banner Indicators */}
          <View style={styles.indicatorsContainer}>
            {PROMO_BANNERS.map((_, index) => {
              const inputRange = [
                (index - 1) * (BANNER_WIDTH + BANNER_SPACING),
                index * (BANNER_WIDTH + BANNER_SPACING),
                (index + 1) * (BANNER_WIDTH + BANNER_SPACING),
              ];

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.8, 1.2, 0.8],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      opacity,
                      transform: [{ scale }],
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Host List */}
        <FlatList
          data={MOCK_HOSTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HostCard host={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Random Call FAB */}
        <Animated.View
          style={[
            styles.fabContainer,
            {
              transform: [{ scale: fabAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={handleRandomCall}
            activeOpacity={0.8}
          >
            <View style={styles.fabGradient}>
              <Ionicons name="shuffle" size={28} color={Colors.white} />
              <Text style={styles.fabText}>Random Call</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function BannerCard({ banner }: { banner: PromoBanner }) {
  return (
    <View style={[styles.banner, { backgroundColor: banner.backgroundColor }]}>
      <Text style={[styles.bannerTitle, { color: banner.textColor }]}>
        {banner.title}
      </Text>
      <Text style={[styles.bannerSubtitle, { color: banner.textColor, opacity: 0.9 }]}>
        {banner.subtitle}
      </Text>
    </View>
  );
}

function HostCard({ host }: { host: Host }) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleViewProfile = () => {
    router.push({
      pathname: '/host-profile',
      params: { hostId: host.id },
    });
  };

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
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleViewProfile}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: host.profilePicture }}
            style={styles.profilePicture}
          />
          {host.isOnline && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>{host.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.rating}>{host.rating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Specialty Tags */}
          {host.specialties && host.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              {host.specialties.slice(0, 3).map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Call Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => handleCall(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={18} color={Colors.primary} />
              <Text style={styles.buttonText}>
                💰 {host.audioCostPerMin}/min
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.videoButton}
              onPress={() => handleCall(true)}
              activeOpacity={0.7}
            >
              <View style={styles.videoButtonGradient}>
                <Ionicons name="videocam" size={18} color={Colors.white} />
                <Text style={styles.videoButtonText}>
                  💰 {host.videoCostPerMin}/min
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
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
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletBalance: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  bannersContainer: {
    marginBottom: 24,
  },
  bannersContent: {
    paddingHorizontal: 20,
  },
  banner: {
    width: BANNER_WIDTH,
    height: 140,
    borderRadius: 20,
    padding: 24,
    marginRight: BANNER_SPACING,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    position: 'relative',
  },
  profilePicture: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.surfaceLight,
  },
  onlineBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  cardContent: {
    padding: 20,
  },
  hostInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostName: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rating: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specialtyTag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  specialtyText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  audioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  videoButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
  },
  videoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    backgroundColor: Colors.primary,
  },
  videoButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  fab: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    backgroundColor: Colors.primary,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: Colors.primary,
  },
  fabText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.white,
  },
});
