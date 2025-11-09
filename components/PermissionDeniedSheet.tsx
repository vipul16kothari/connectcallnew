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
import { openAppSettings, PermissionType, getPermissionName } from '@/services/permissions';

interface PermissionDeniedSheetProps {
  visible: boolean;
  deniedPermissions: PermissionType[];
  callType: 'audio' | 'video';
  onClose: () => void;
}

export default function PermissionDeniedSheet({
  visible,
  deniedPermissions,
  callType,
  onClose,
}: PermissionDeniedSheetProps) {
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

  const handleOpenSettings = async () => {
    await openAppSettings();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={48} color={Colors.warning} />
              </View>
              <Text style={styles.title}>Permissions Required</Text>
              <Text style={styles.subtitle}>
                We need access to the following permissions to start your {callType} call:
              </Text>
            </View>

            {/* Denied Permissions List */}
            <View style={styles.permissionsContainer}>
              {deniedPermissions.map((permission) => (
                <View key={permission} style={styles.permissionItem}>
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                  <Text style={styles.permissionText}>{getPermissionName(permission)}</Text>
                </View>
              ))}
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>How to enable permissions:</Text>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Tap &quot;Open Settings&quot; below</Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Find and tap on &quot;Permissions&quot;</Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>
                  Enable {deniedPermissions.map((p) => getPermissionName(p)).join(' and ')}
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>Return to the app and try again</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleOpenSettings}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={20} color={Colors.white} />
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.warning,
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
    gap: 12,
    marginBottom: 24,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  permissionText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.white,
  },
  instructions: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  actions: {
    gap: 12,
  },
  settingsButton: {
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
  settingsButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});
