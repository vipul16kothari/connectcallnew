import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Privacy Policy</Text>
        <Text style={styles.updatedText}>Last updated: November 2024</Text>

        <View style={styles.section}>
          <Text style={styles.subheading}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly to us, such as when you
            create an account, make a purchase, or contact us for support. This
            may include your name, email address, phone number, and payment
            information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to provide, maintain, and improve
            our services, process transactions, send you technical notices and
            support messages, and respond to your comments and questions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>3. Information Sharing</Text>
          <Text style={styles.paragraph}>
            We do not share your personal information with third parties except
            as described in this policy. We may share information with service
            providers who perform services on our behalf, and when required by
            law or to protect our rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>4. Data Security</Text>
          <Text style={styles.paragraph}>
            We take reasonable measures to help protect your personal
            information from loss, theft, misuse, unauthorized access,
            disclosure, alteration, and destruction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>5. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to access, update, or delete your personal
            information. You may also have the right to object to or restrict
            certain types of processing of your information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>6. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact
            us at privacy@connectcall.com.
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  updatedText: {
    fontSize: FontSizes.sm,
    color: Colors.text.light,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  subheading: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
});
