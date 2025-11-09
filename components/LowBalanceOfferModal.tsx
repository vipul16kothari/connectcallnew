import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { BlurView } from 'expo-blur';
import { LIMITED_OFFER_PACKAGE } from '@/data/coinPackages';

interface LowBalanceOfferModalProps {
  visible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

const { width } = Dimensions.get('window');

export default function LowBalanceOfferModal({
  visible,
  onAccept,
  onDismiss,
}: LowBalanceOfferModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const coinFloatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Countdown timer
  useEffect(() => {
    if (visible && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [visible, timeRemaining]);

  // Entrance animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, fadeAnim, slideAnim]);

  // Floating coins animation
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(coinFloatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(coinFloatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, [coinFloatAnim]);

  // Pulse animation for CTA button
  useEffect(() => {
    const pulseAnimation = Animated.loop(
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
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <BlurView intensity={90} style={styles.blurContainer}>
        <SafeAreaView style={styles.container}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss} activeOpacity={0.7}>
              <Ionicons name="close" size={28} color={Colors.text.secondary} />
            </TouchableOpacity>

            {/* Floating Coins Background */}
            <Animated.View
              style={[styles.coinsBackground, { transform: [{ translateY: coinFloatAnim }] }]}
            >
              <Text style={styles.floatingCoin}>💰</Text>
              <Text style={[styles.floatingCoin, styles.floatingCoin2]}>💎</Text>
              <Text style={[styles.floatingCoin, styles.floatingCoin3]}>⭐</Text>
              <Text style={[styles.floatingCoin, styles.floatingCoin4]}>💰</Text>
            </Animated.View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="flash" size={64} color={Colors.warning} />
              </View>
              <Text style={styles.title}>Limited Time Offer!</Text>
              <Text style={styles.subtitle}>Don&apos;t miss this exclusive deal</Text>
            </View>

            {/* Countdown Timer */}
            <View style={styles.timerContainer}>
              <Ionicons name="time" size={24} color={Colors.warning} />
              <Text style={styles.timerText}>Offer ends in</Text>
              <View style={styles.timerBadge}>
                <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
              </View>
            </View>

            {/* Offer Card */}
            <View style={styles.offerCard}>
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>
                  {LIMITED_OFFER_PACKAGE.tagEmoji} {LIMITED_OFFER_PACKAGE.discount}% OFF
                </Text>
              </View>

              <View style={styles.offerContent}>
                <Text style={styles.offerCoinIcon}>💰</Text>
                <Text style={styles.offerCoinAmount}>{LIMITED_OFFER_PACKAGE.coins}</Text>
                <Text style={styles.offerCoinLabel}>COINS</Text>

                <View style={styles.offerPricing}>
                  <Text style={styles.offerOriginalPrice}>
                    {LIMITED_OFFER_PACKAGE.originalPrice}
                  </Text>
                  <Text style={styles.offerPrice}>{LIMITED_OFFER_PACKAGE.price}</Text>
                </View>

                <View style={styles.offerSavings}>
                  <Text style={styles.offerSavingsText}>
                    You save{' '}
                    {(
                      parseFloat(LIMITED_OFFER_PACKAGE.originalPrice!.replace('$', '')) -
                      parseFloat(LIMITED_OFFER_PACKAGE.price.replace('$', ''))
                    ).toFixed(2)}
                    $
                  </Text>
                </View>
              </View>
            </View>

            {/* Benefits */}
            <View style={styles.benefits}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                <Text style={styles.benefitText}>Instant delivery</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                <Text style={styles.benefitText}>One-time offer</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                <Text style={styles.benefitText}>Best value package</Text>
              </View>
            </View>

            {/* CTA Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={onAccept}
                activeOpacity={0.9}
              >
                <Ionicons name="flash" size={24} color={Colors.white} />
                <Text style={styles.ctaButtonText}>Grab This Deal</Text>
                <Ionicons name="arrow-forward" size={24} color={Colors.white} />
              </TouchableOpacity>
            </Animated.View>

            {/* Dismiss Link */}
            <TouchableOpacity style={styles.dismissLink} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={styles.dismissLinkText}>Maybe later</Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: Colors.surface,
    borderRadius: 32,
    padding: 32,
    maxWidth: 500,
    width: '100%',
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  coinsBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    zIndex: 0,
  },
  floatingCoin: {
    position: 'absolute',
    fontSize: 48,
    top: 20,
    left: 20,
  },
  floatingCoin2: {
    top: 60,
    left: width * 0.7,
    fontSize: 40,
  },
  floatingCoin3: {
    top: width * 0.4,
    left: 30,
    fontSize: 36,
  },
  floatingCoin4: {
    top: width * 0.5,
    left: width * 0.75,
    fontSize: 44,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.warning,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    zIndex: 1,
  },
  timerText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.warning,
  },
  timerBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerValue: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  offerCard: {
    backgroundColor: 'rgba(167, 125, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.accent,
    zIndex: 1,
  },
  offerBadge: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  offerBadgeText: {
    backgroundColor: Colors.error,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  offerContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  offerCoinIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  offerCoinAmount: {
    fontSize: 56,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 4,
  },
  offerCoinLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  offerPricing: {
    alignItems: 'center',
    marginBottom: 12,
  },
  offerOriginalPrice: {
    fontSize: FontSizes.xl,
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  offerPrice: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.accent,
  },
  offerSavings: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  offerSavingsText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.white,
  },
  benefits: {
    gap: 12,
    marginBottom: 24,
    zIndex: 1,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1,
  },
  ctaButtonText: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.white,
  },
  dismissLink: {
    paddingVertical: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  dismissLinkText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
