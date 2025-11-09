import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { LIMITED_OFFER_PACKAGE } from '@/data/coinPackages';
import { BlurView } from 'expo-blur';

interface LowBalanceBottomSheetProps {
  visible: boolean;
  timeRemaining: number; // in seconds
  onAccept: () => void;
  onDismiss: () => void;
}

const SHEET_HEIGHT = 180;

export default function LowBalanceBottomSheet({
  visible,
  timeRemaining,
  onAccept,
  onDismiss,
}: LowBalanceBottomSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const coinFloatAnim = useRef(new Animated.Value(0)).current;

  // Slide animation
  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  // Floating coins animation
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(coinFloatAnim, {
          toValue: -8,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <BlurView intensity={95} tint="dark" style={styles.blurView}>
        {/* Floating Coins Background */}
        <Animated.View
          style={[styles.coinsBackground, { transform: [{ translateY: coinFloatAnim }] }]}
        >
          <Text style={styles.floatingCoin}>💰</Text>
          <Text style={[styles.floatingCoin, styles.floatingCoin2]}>💎</Text>
          <Text style={[styles.floatingCoin, styles.floatingCoin3]}>⭐</Text>
        </Animated.View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onDismiss} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={28} color={Colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Left Side - Offer Info */}
          <View style={styles.leftSide}>
            <View style={styles.offerBadge}>
              <Ionicons name="flash" size={16} color={Colors.warning} />
              <Text style={styles.offerBadgeText}>{LIMITED_OFFER_PACKAGE.discount}% OFF</Text>
            </View>

            <View style={styles.offerInfo}>
              <Text style={styles.coinAmount}>
                💰 {LIMITED_OFFER_PACKAGE.coins}
                <Text style={styles.coinLabel}> coins</Text>
              </Text>
              <View style={styles.pricingRow}>
                <Text style={styles.originalPrice}>{LIMITED_OFFER_PACKAGE.originalPrice}</Text>
                <Text style={styles.price}>{LIMITED_OFFER_PACKAGE.price}</Text>
              </View>
            </View>

            <View style={styles.timerBadge}>
              <Ionicons name="time" size={14} color={Colors.warning} />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>

          {/* Right Side - CTA Button */}
          <TouchableOpacity style={styles.ctaButton} onPress={onAccept} activeOpacity={0.8}>
            <Text style={styles.ctaButtonText}>Grab Deal</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    zIndex: 1000,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  blurView: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.accent,
  },
  coinsBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
    zIndex: 0,
  },
  floatingCoin: {
    position: 'absolute',
    fontSize: 36,
    top: 10,
    left: 20,
  },
  floatingCoin2: {
    top: 80,
    left: '70%',
    fontSize: 32,
  },
  floatingCoin3: {
    top: 40,
    left: '85%',
    fontSize: 28,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  leftSide: {
    flex: 1,
    gap: 8,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  offerBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  offerInfo: {
    gap: 4,
  },
  coinAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.white,
  },
  coinLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: Colors.accent,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  timerText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.warning,
    letterSpacing: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
  },
  ctaButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.white,
  },
});
