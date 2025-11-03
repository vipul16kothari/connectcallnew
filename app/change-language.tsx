import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';

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

export default function ChangeLanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const handleSave = () => {
    Alert.alert(
      'Language Changed',
      `Your language has been changed to ${selectedLanguage}.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Change Language</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Language List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instruction}>Select your preferred language</Text>

        <View style={styles.languageList}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language}
              style={[
                styles.languageItem,
                selectedLanguage === language && styles.languageItemSelected,
              ]}
              onPress={() => setSelectedLanguage(language)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageText,
                  selectedLanguage === language && styles.languageTextSelected,
                ]}
              >
                {language}
              </Text>
              {selectedLanguage === language && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
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
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  instruction: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  languageList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageItemSelected: {
    backgroundColor: `${Colors.accent}10`,
  },
  languageText: {
    fontSize: FontSizes.base,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  languageTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
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
  saveButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});
