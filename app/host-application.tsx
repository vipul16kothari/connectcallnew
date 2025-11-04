import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';

export default function HostApplicationScreen() {
  const router = useRouter();
  const { userProfile, updateHostStatus } = useUser();
  const [age, setAge] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const recordingAnim = useRef(new Animated.Value(1)).current;

  const startRecording = () => {
    setIsRecording(true);
    // Animate the microphone icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate recording for 5 seconds
    setTimeout(() => {
      stopRecording();
    }, 5000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecording(true);
    recordingAnim.stopAnimation();
    recordingAnim.setValue(1);
  };

  const playRecording = () => {
    setIsPlaying(true);
    // Simulate playback
    setTimeout(() => {
      setIsPlaying(false);
    }, 5000);
  };

  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setHasRecording(false);
            setIsPlaying(false);
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!age.trim() || !hasRecording) {
      Alert.alert('Incomplete Form', 'Please fill in your age and record a voice intro.');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      Alert.alert('Invalid Age', 'Please enter a valid age (18-100).');
      return;
    }

    // Update host status to pending
    await updateHostStatus('pending');

    // Navigate to verification screen
    router.replace('/host-verification');
  };

  const isFormValid = age.trim() && hasRecording;

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
        <Text style={styles.headerTitle}>SuperHost Application</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Welcome! 👋</Text>
            <Text style={styles.introText}>
              We&apos;re excited that you want to become a SuperHost. Please provide a few details to get started.
            </Text>
          </View>

          {/* Name Field (Pre-filled) */}
          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{userProfile?.name || 'Your Name'}</Text>
            </View>
          </View>

          {/* Age Field */}
          <View style={styles.section}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor={Colors.text.light}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          {/* Voice Intro Section */}
          <View style={styles.section}>
            <Text style={styles.label}>15-Second Voice Intro</Text>
            <Text style={styles.hint}>
              Introduce yourself! Tell potential callers about your interests and what you&apos;d like to chat about.
            </Text>

            {!hasRecording ? (
              <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
                disabled={isRecording}
              >
                <Animated.View style={{ transform: [{ scale: recordingAnim }] }}>
                  <Ionicons
                    name={isRecording ? 'stop-circle' : 'mic'}
                    size={48}
                    color={isRecording ? Colors.error : Colors.secondary}
                  />
                </Animated.View>
                <Text style={[styles.recordButtonText, isRecording && styles.recordButtonTextActive]}>
                  {isRecording ? 'Recording...' : 'Tap to Record'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.recordingCard}>
                <View style={styles.recordingInfo}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.secondary} />
                  <Text style={styles.recordingText}>Voice intro recorded</Text>
                </View>
                <View style={styles.recordingActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={playRecording}
                    disabled={isPlaying}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={24}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={deleteRecording}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <Text style={styles.infoText}>
              Your application will be reviewed within 24 hours. We&apos;ll notify you once approved!
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit Application</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  intro: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  introText: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: FontSizes.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputDisabledText: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
  },
  recordButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderStyle: 'dashed',
  },
  recordButtonActive: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.error,
    borderStyle: 'solid',
  },
  recordButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
  },
  recordButtonTextActive: {
    color: Colors.error,
  },
  recordingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recordingText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
