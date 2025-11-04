import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import { parseError, validatePhoneNumber } from '@/utils/errorHandler';

export default function LoginScreen() {
  const router = useRouter();
  const { login, dummyLogin, isLoading } = useUser();
  const { showError, showSuccess, showInfo } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tapCount, setTapCount] = useState(0);

  const handleContinue = async () => {
    // Validate phone number
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      showError(validation.message || 'Invalid phone number');
      return;
    }

    try {
      // Try to login first
      try {
        await login(phoneNumber);
        showSuccess('Login successful!');
        router.replace('/(tabs)');
      } catch (loginError: any) {
        // If account doesn't exist (404), create new account
        if (loginError.code === 404 || loginError.message?.includes('not found')) {
          // Prompt for name to create account
          showError('Account not found. Creating new account...');
          router.push({
            pathname: '/profile-creation',
            params: { phoneNumber },
          });
        } else {
          // Other login errors
          throw loginError;
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      const appError = parseError(error);
      showError(appError.message);
    }
  };

  const handleLogoTap = async () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount === 5) {
      // Trigger dummy login
      showInfo('🔓 Dummy login activated...');
      try {
        await dummyLogin();
        showSuccess('✅ Logged in as Test User (500 coins)');
        router.replace('/(tabs)');
      } catch (err) {
        console.error('Dummy login error:', err);
        showError('Failed to activate dummy login');
      }
      setTapCount(0);
    } else if (newCount === 3) {
      // Give user a hint
      showInfo(`Tap ${5 - newCount} more times for dummy login`);
    }

    // Reset counter after 2 seconds
    setTimeout(() => setTapCount(0), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to</Text>
          <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.8}>
            <Text style={styles.appName}>Connectcall</Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>
            Enter your phone number to continue
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.text.tertiary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={15}
              editable={!isLoading}
              autoFocus
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Legal Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.linkText}
              onPress={() => router.push('/privacy-policy')}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={styles.linkText}
              onPress={() => router.push('/privacy-policy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  appName: {
    fontSize: FontSizes['4xl'],
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FontSizes.base,
    color: Colors.text.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.white,
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
