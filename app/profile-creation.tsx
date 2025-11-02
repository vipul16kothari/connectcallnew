import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';

const GENDERS = ['Male', 'Female', 'Other'];
const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Russian',
];

export default function ProfileCreationScreen() {
  const [name, setName] = useState('');
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const handleCompleteProfile = () => {
    if (name.trim() && selectedGender && selectedLanguages.length > 0) {
      console.log('Profile created:', {
        name,
        gender: selectedGender,
        languages: selectedLanguages,
      });
      // Navigation to home screen will be implemented in next phase
    }
  };

  const isFormValid = name.trim() && selectedGender && selectedLanguages.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Profile</Text>
          <Text style={styles.subtitle}>
            Tell us a bit about yourself to get started
          </Text>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={Colors.text.light}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* Gender Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionsRow}>
            {GENDERS.map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.optionButton,
                  selectedGender === gender && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedGender(gender)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedGender === gender && styles.optionTextSelected,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Languages Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Languages{' '}
            <Text style={styles.labelHint}>(Select one or more)</Text>
          </Text>
          <View style={styles.languagesGrid}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageChip,
                  selectedLanguages.includes(language) &&
                    styles.languageChipSelected,
                ]}
                onPress={() => toggleLanguage(language)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageText,
                    selectedLanguages.includes(language) &&
                      styles.languageTextSelected,
                  ]}
                >
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            !isFormValid && styles.buttonDisabled,
          ]}
          onPress={handleCompleteProfile}
          disabled={!isFormValid}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Complete Profile</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  labelHint: {
    fontSize: FontSizes.sm,
    fontWeight: '400',
    color: Colors.text.light,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: FontSizes.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionButtonSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  optionText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  optionTextSelected: {
    color: Colors.white,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageChip: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  languageChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  languageText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  languageTextSelected: {
    color: Colors.white,
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
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
