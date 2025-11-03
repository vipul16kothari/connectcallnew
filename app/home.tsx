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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { MOCK_HOSTS, INITIAL_WALLET_BALANCE } from '@/data/mockData';
import { Host } from '@/types/host';

export default function HomeScreen() {
  const router = useRouter();
  const [walletBalance] = useState(INITIAL_WALLET_BALANCE);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/connectcall-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.walletButton}
          onPress={() => router.push('/wallet')}
          activeOpacity={0.7}
        >
          <Text style={styles.walletIcon}>💰</Text>
          <Text style={styles.walletBalance}>{walletBalance}</Text>
        </TouchableOpacity>
      </View>

      {/* Host Feed */}
      <FlatList
        data={MOCK_HOSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HostCard host={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function HostCard({ host }: { host: Host }) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Glowing animation for online indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    router.push({
      pathname: '/host-profile',
      params: { hostId: host.id },
    });
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Image
          source={{ uri: host.profilePicture }}
          style={styles.profilePicture}
        />
        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={styles.hostName}>{host.name}</Text>
            {host.isOnline && (
              <Animated.View
                style={[
                  styles.onlineIndicator,
                  {
                    opacity: glowAnim,
                    transform: [{ scale: glowAnim }],
                  },
                ]}
              />
            )}
          </View>
          <Text style={styles.languages}>
            🌐 {host.languages.join(', ')}
          </Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>★ {host.rating.toFixed(1)}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    width: 40,
    height: 40,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  walletIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  walletBalance: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.border,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hostName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginRight: 8,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  languages: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#FFA500',
  },
});
