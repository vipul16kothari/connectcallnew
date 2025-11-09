import React, { useEffect, useRef, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  }, [translateY, opacity, onHide]);

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration, hideToast, translateY, opacity]);

  if (!visible) {
    return null;
  }

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.secondary,
          icon: 'checkmark-circle' as const,
          iconColor: Colors.white,
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'close-circle' as const,
          iconColor: Colors.white,
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: 'warning' as const,
          iconColor: Colors.white,
        };
      case 'info':
      default:
        return {
          backgroundColor: Colors.primary,
          icon: 'information-circle' as const,
          iconColor: Colors.white,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: config.backgroundColor }]}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <Ionicons name={config.icon} size={24} color={config.iconColor} />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={20} color={config.iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: SCREEN_WIDTH - 32,
  },
  message: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 20,
  },
});
