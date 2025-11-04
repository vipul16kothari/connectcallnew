import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { useUser } from '@/contexts/UserContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, createAccount, isLoading } = useUser();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    if (isNewUser && !name.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }

    try {
      if (isNewUser) {
        await createAccount(phoneNumber, name);
        // After account creation, redirect to profile creation
        router.replace('/profile-creation');
      } else {
        await login(phoneNumber);
        // After login, user will be redirected based on profile status
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);

      if (error.code === 404 || error.message?.includes('not found')) {
        Alert.alert(
          'Account Not Found',
          'No account found with this phone number. Would you like to create a new account?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Account',
              onPress: () => setIsNewUser(true),
            },
          ]
        );
      } else if (error.code === 409 || error.message?.includes('already exists')) {
        Alert.alert(
          'Account Exists',
          'An account with this phone number already exists. Please login instead.',
          [{ text: 'OK', onPress: () => setIsNewUser(false) }]
        );
      } else {
        Alert.alert(
          'Authentication Error',
          error.message || 'Failed to authenticate. Please try again.'
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>Connectcall</Text>
          <Text style={styles.subtitle}>
            {isNewUser ? 'Create your account to get started' : 'Login to continue'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {isNewUser && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={Colors.text.tertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.text.tertiary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!isLoading}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isNewUser ? 'Create Account' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Login/Signup */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsNewUser(!isNewUser)}
            disabled={isLoading}
          >
            <Text style={styles.toggleText}>
              {isNewUser ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleTextBold}>
                {isNewUser ? 'Login' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
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
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  toggleTextBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
