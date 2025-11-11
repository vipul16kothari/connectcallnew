import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import { configService, transactionService } from '@/services/appwrite';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InCallRechargeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

interface QuickPackage {
  id: string;
  coins: number;
  priceDisplay: string;
  priceValue: number;
  popular?: boolean;
}

const FALLBACK_QUICK_PACKAGES: QuickPackage[] = [
  { id: 'quick_50', coins: 50, priceDisplay: '₹49', priceValue: 49 },
  { id: 'quick_100', coins: 100, priceDisplay: '₹99', priceValue: 99, popular: true },
  { id: 'quick_200', coins: 200, priceDisplay: '₹199', priceValue: 199 },
];

export default function InCallRechargeSheet({
  visible,
  onClose,
  onSuccess,
}: InCallRechargeSheetProps) {
  const { user, updateWallet } = useUser();
  const { showError, showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packages, setPackages] = useState<QuickPackage[]>(FALLBACK_QUICK_PACKAGES);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPackages = async () => {
      try {
        const remotePackages = await configService.getQuickTopupPackages();
        if (!mounted) {
          return;
        }

        if (remotePackages.length > 0) {
          const mapped = remotePackages.map((pkg) => ({
            id: pkg.id,
            coins: pkg.coins,
            priceDisplay: pkg.priceDisplay,
            priceValue: pkg.priceValue,
            popular: pkg.popular,
          }));
          setPackages(mapped);
        } else {
          setPackages(FALLBACK_QUICK_PACKAGES);
        }
      } catch (error) {
        console.error('Failed to load quick recharge packages', error);
        if (mounted) {
          setPackages(FALLBACK_QUICK_PACKAGES);
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
  }, []);

  const handlePurchase = async (pkg: QuickPackage) => {
    if (isLoading || isLoadingPackages) return;

    try {
      setIsLoading(true);
      setSelectedPackage(pkg.id);

      // Simulate payment processing (in production, call payment gateway)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update wallet balance
      await updateWallet(pkg.coins);

      if (user?.authUser) {
        try {
          await transactionService.createTransaction({
            userId: user.authUser.$id,
            type: 'purchase',
            amount: pkg.coins,
            description: pkg.priceDisplay
              ? `Quick recharge - ${pkg.coins} coins (${pkg.priceDisplay})`
              : `Quick recharge - ${pkg.coins} coins`,
          });
        } catch (transactionError) {
          console.warn('Failed to record quick recharge transaction', transactionError);
        }
      }

      showSuccess(`${pkg.coins} coins added to your wallet!`);
      onSuccess(pkg.coins);
      onClose();
    } catch (error: any) {
      console.error('Recharge error:', error);
      showError('Failed to add coins. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="flash" size={28} color={Colors.secondary} />
                <Text style={styles.headerTitle}>Quick Recharge</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isLoading}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>
              Keep your conversation going!
            </Text>
          </View>

          {/* Current Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              💰 {user?.userProfile?.walletBalance || 0} coins
            </Text>
          </View>

          {/* Quick Packages */}
          <ScrollView
            style={styles.packagesContainer}
            contentContainerStyle={styles.packagesContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Quick Top-Up</Text>
            {isLoadingPackages ? (
              <View style={styles.loadingPackages}>
                <ActivityIndicator size="small" color={Colors.secondary} />
                <Text style={styles.loadingPackagesText}>Loading packages...</Text>
              </View>
            ) : (
              packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    pkg.popular && styles.packageCardPopular,
                    selectedPackage === pkg.id && styles.packageCardSelected,
                  ]}
                  onPress={() => handlePurchase(pkg)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Most Popular</Text>
                    </View>
                  )}
                  <View style={styles.packageLeft}>
                    <View style={styles.packageIcon}>
                      <Ionicons
                        name="diamond"
                        size={24}
                        color={pkg.popular ? Colors.secondary : Colors.primary}
                      />
                    </View>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageCoins}>{pkg.coins} Coins</Text>
                      <Text style={styles.packagePrice}>{pkg.priceDisplay}</Text>
                    </View>
                  </View>
                  {selectedPackage === pkg.id ? (
                    <ActivityIndicator size="small" color={Colors.secondary} />
                  ) : (
                    <Ionicons
                      name="arrow-forward-circle"
                      size={28}
                      color={pkg.popular ? Colors.secondary : Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer Note */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.text.light} />
            <Text style={styles.footerText}>
              Secure payment • Instant recharge
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },
  packagesContainer: {
    flex: 1,
  },
  packagesContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  loadingPackages: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingPackagesText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  packageCardPopular: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(0, 209, 197, 0.05)',
  },
  packageCardSelected: {
    opacity: 0.7,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageInfo: {
    gap: 4,
  },
  packageCoins: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  packagePrice: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footerText: {
    fontSize: FontSizes.xs,
    color: Colors.text.light,
  },
});
