import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { BlurView } from 'expo-blur';
import {
  PermissionType,
  getPermissionName,
  getPermissionExplanation,
  getPermissionIcon,
} from '@/services/permissions';

interface PermissionExplanationSheetProps {
  visible: boolean;
  permissions: PermissionType[];
  callType: 'audio' | 'video';
  onContinue: () => void;
  onCancel: () => void;
}

export default function PermissionExplanationSheet({
  visible,
  permissions,
  callType,
  onContinue,
  onCancel,
}: PermissionExplanationSheetProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <BlurView intensity={80} style={styles.blurContainer}>
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
            <TouchableOpacity style={styles.closeButton} onPress={onCancel} activeOpacity={0.7}>
              <Ionicons name="close" size={28} color={Colors.text.secondary} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={callType === 'video' ? 'videocam' : 'call'}
                  size={48}
                  color={Colors.accent}
                />
              </View>
              <Text style={styles.title}>
                Let&apos;s Start Your {callType === 'video' ? 'Video' : 'Audio'} Call
              </Text>
              <Text style={styles.subtitle}>
                To ensure the best calling experience, we need access to a few features on your
                device
              </Text>
            </View>

            {/* Permission Cards */}
            <View style={styles.permissionsContainer}>
              {permissions.map((permission, index) => (
                <View key={permission} style={styles.permissionCard}>
                  <View style={styles.permissionIconContainer}>
                    <Ionicons
                      name={getPermissionIcon(permission) as any}
                      size={32}
                      color={Colors.accent}
                    />
                  </View>
                  <View style={styles.permissionTextContainer}>
                    <Text style={styles.permissionName}>{getPermissionName(permission)}</Text>
                    <Text style={styles.permissionExplanation}>
                      {getPermissionExplanation(permission)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.secondary} />
              <Text style={styles.privacyText}>
                Your privacy matters. We only use these permissions during calls and never access
                them without your knowledge.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={onContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
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
    padding: 24,
  },
  content: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 32,
    maxWidth: 500,
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
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
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(167, 125, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  permissionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  permissionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(167, 125, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  permissionName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  permissionExplanation: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 209, 197, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 197, 0.2)',
  },
  privacyText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  continueButton: {
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
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
