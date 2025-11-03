import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { COIN_PACKAGES, INITIAL_WALLET_BALANCE } from '@/data/mockData';
import { CoinPackage } from '@/types/host';
import { Ionicons } from '@expo/vector-icons';

export default function WalletScreen() {
  const router = useRouter();

  const handlePurchase = (coinPackage: CoinPackage) => {
    Alert.alert(
      'Purchase Coins',
      `Payment functionality is not yet implemented.\n\nYou attempted to purchase ${coinPackage.coins} coins for ${coinPackage.price}.`,
      [{ text: 'OK' }]
    );
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
          <Text style={styles.balanceAmount}>{INITIAL_WALLET_BALANCE}</Text>
          <Text style={styles.balanceSubtext}>coins</Text>
        </View>

        {/* Packages Section */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Top-Up Packages</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a package to add coins to your wallet
          </Text>

          {COIN_PACKAGES.map((pkg) => (
            <View key={pkg.id} style={styles.packageWrapper}>
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}
              <View
                style={[
                  styles.packageCard,
                  pkg.popular && styles.packageCardPopular,
                ]}
              >
                <View style={styles.packageInfo}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageCoins}>{pkg.coins}</Text>
                    <Text style={styles.packageCoinsLabel}>coins</Text>
                  </View>
                  <Text style={styles.packagePrice}>{pkg.price}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.purchaseButton,
                    pkg.popular && styles.purchaseButtonPopular,
                  ]}
                  onPress={() => handlePurchase(pkg)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.purchaseButtonText,
                      pkg.popular && styles.purchaseButtonTextPopular,
                    ]}
                  >
                    Purchase
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={pkg.popular ? Colors.white : Colors.accent}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.accent} />
            <Text style={styles.infoText}>Secure payment processing</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={24} color={Colors.accent} />
            <Text style={styles.infoText}>Instant coin delivery</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="help-circle" size={24} color={Colors.accent} />
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
    backgroundColor: Colors.white,
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceIcon: {
    fontSize: 40,
  },
  balanceLabel: {
    fontSize: FontSizes.base,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: FontSizes.lg,
    color: Colors.white,
    opacity: 0.8,
  },
  packagesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  packageWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    zIndex: 10,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  packageCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  packageCardPopular: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  packageInfo: {
    flex: 1,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  packageCoins: {
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
    color: Colors.text.primary,
    marginRight: 6,
  },
  packageCoinsLabel: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
  },
  packagePrice: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.accent,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  purchaseButtonPopular: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  purchaseButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.accent,
  },
  purchaseButtonTextPopular: {
    color: Colors.white,
  },
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    flex: 1,
  },
});
