import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { INITIAL_WALLET_BALANCE } from '@/data/mockData';
import { ENHANCED_COIN_PACKAGES, EnhancedCoinPackage } from '@/data/coinPackages';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/contexts/ToastContext';
import { useUser } from '@/contexts/UserContext';
import {
  configService,
  transactionService,
  type ConfiguredCoinPackage,
} from '@/services/appwrite';

interface CoinPackageCardProps {
  package: EnhancedCoinPackage;
  onPress: () => void;
}

function CoinPackageCard({ package: pkg, onPress }: CoinPackageCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.packageCardTouchable}
    >
      <Animated.View
        style={[
          styles.packageCard,
          pkg.popular && styles.packageCardPopular,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Tag */}
        {pkg.tag && (
          <View style={[styles.packageTag, pkg.popular && styles.packageTagPopular]}>
            <Text style={styles.packageTagText}>
              {pkg.tagEmoji} {pkg.tag}
            </Text>
          </View>
        )}

        {/* Coin Amount */}
        <View style={styles.packageCoinContainer}>
          <Text style={styles.packageCoinIcon}>💰</Text>
          <Text style={styles.packageCoinAmount}>{pkg.coins}</Text>
          <Text style={styles.packageCoinLabel}>coins</Text>
        </View>

        {/* Pricing */}
        <View style={styles.packagePricing}>
          {pkg.originalPrice && (
            <Text style={styles.packageOriginalPrice}>{pkg.originalPrice}</Text>
          )}
          <Text style={[styles.packagePrice, pkg.popular && styles.packagePricePopular]}>
            {pkg.price}
          </Text>
          {pkg.discount && (
            <View style={styles.packageDiscountBadge}>
              <Text style={styles.packageDiscountText}>{pkg.discount}% OFF</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function mapConfiguredCoinPackage(pkg: ConfiguredCoinPackage): EnhancedCoinPackage {
  return {
    id: pkg.id,
    coins: pkg.coins,
    price: pkg.priceDisplay || `₹${pkg.priceValue}`,
    originalPrice: undefined,
    discount: pkg.discount,
    tag: pkg.tag,
    tagEmoji: pkg.tagEmoji,
    popular: pkg.popular,
    isLimitedOffer: pkg.isLimitedOffer,
  };
}

export default function WalletScreen() {
  const router = useRouter();
  const { showInfo } = useToast();
  const { user } = useUser();
  const [coinPackages, setCoinPackages] = useState<EnhancedCoinPackage[]>(ENHANCED_COIN_PACKAGES);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [hasRecharged, setHasRecharged] = useState(false);

  const currentBalance = user?.userProfile?.walletBalance || INITIAL_WALLET_BALANCE;

  useEffect(() => {
    let mounted = true;

    const loadPackages = async () => {
      if (!user?.authUser) {
        setHasRecharged(false);
        setCoinPackages(ENHANCED_COIN_PACKAGES);
        setIsLoadingPackages(false);
        return;
      }

      setIsLoadingPackages(true);

      try {
        const hasPurchase = await transactionService.hasCompletedPurchase(user.authUser.$id);
        if (!mounted) {
          return;
        }

        setHasRecharged(hasPurchase);
        const stage = hasPurchase ? 'repeat' : 'first';
        const remotePackages = await configService.getCoinPackages(stage);

        if (!mounted) {
          return;
        }

        if (remotePackages.length > 0) {
          setCoinPackages(remotePackages.map(mapConfiguredCoinPackage));
        } else {
          setCoinPackages(ENHANCED_COIN_PACKAGES);
        }
      } catch (error) {
        console.error('Failed to load wallet packages', error);
        if (mounted) {
          setCoinPackages(ENHANCED_COIN_PACKAGES);
        }
      } finally {
        if (mounted) {
          setIsLoadingPackages(false);
        }
      }
    };

    loadPackages();

    return () => {
      mounted = false;
    };
  }, [user?.authUser]);

  const handlePurchase = (coinPackage: EnhancedCoinPackage) => {
    try {
      // TODO: Implement actual payment functionality
      showInfo(
        `Payment integration coming soon! Package: ${coinPackage.coins} coins for ${coinPackage.price}`
      );
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIconContainer}>
            <Text style={styles.balanceIcon}>💰</Text>
          </View>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{currentBalance}</Text>
          <Text style={styles.balanceSubtext}>coins</Text>
        </View>

        {/* Packages Section */}
        <View style={styles.packagesSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Choose Your Package</Text>
              <Text style={styles.sectionSubtitle}>
                {hasRecharged
                  ? 'Recharge again and keep talking'
                  : 'Unlock exclusive first recharge offers'}
              </Text>
            </View>
            <View style={styles.flashSaleBadge}>
              <Ionicons name="flash" size={16} color={Colors.warning} />
              <Text style={styles.flashSaleText}>50% OFF</Text>
            </View>
          </View>

          {/* 3x4 Grid */}
          <View style={styles.packagesGrid}>
            {isLoadingPackages ? (
              <View style={styles.loadingPackagesContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingPackagesText}>Loading packages...</Text>
              </View>
            ) : coinPackages.length === 0 ? (
              <Text style={styles.emptyPackagesText}>
                Packages are unavailable right now. Please check back soon.
              </Text>
            ) : (
              coinPackages.map((pkg) => (
                <CoinPackageCard key={pkg.id} package={pkg} onPress={() => handlePurchase(pkg)} />
              ))
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.secondary} />
            <Text style={styles.infoText}>Secure payment processing</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flash" size={24} color={Colors.secondary} />
            <Text style={styles.infoText}>Instant coin delivery</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="headset" size={24} color={Colors.secondary} />
            <Text style={styles.infoText}>24/7 support available</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  balanceIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceIcon: {
    fontSize: 36,
  },
  balanceLabel: {
    fontSize: FontSizes.sm,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: FontSizes.base,
    color: Colors.white,
    opacity: 0.8,
  },
  packagesSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  flashSaleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  flashSaleText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  loadingPackagesContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingPackagesText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  emptyPackagesText: {
    width: '100%',
    textAlign: 'center',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    paddingVertical: 24,
  },
  packageCardTouchable: {
    width: '31.5%', // 3 columns with gaps
  },
  packageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  packageCardPopular: {
    borderColor: Colors.accent,
    borderWidth: 2,
    backgroundColor: 'rgba(167, 125, 255, 0.08)',
  },
  packageTag: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  packageTagPopular: {
    backgroundColor: Colors.accent,
  },
  packageTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  packageCoinContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  packageCoinIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  packageCoinAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  packageCoinLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packagePricing: {
    alignItems: 'center',
    width: '100%',
  },
  packageOriginalPrice: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  packagePrice: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 4,
  },
  packagePricePopular: {
    color: Colors.accent,
  },
  packageDiscountBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  packageDiscountText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
});
