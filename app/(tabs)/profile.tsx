import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';

const MENU_ITEMS = [
  {
    id: 'transactions',
    title: 'Payment Transaction History',
    icon: 'receipt-outline' as const,
    route: '/transactions',
  },
  {
    id: 'language',
    title: 'Change Language',
    icon: 'language-outline' as const,
    route: '/change-language',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: 'shield-checkmark-outline' as const,
    route: '/privacy-policy',
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Navigate back to login screen
            router.replace('/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color={Colors.white} />
          </View>
          <Text style={styles.userName}>John Doe</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === 0 && styles.menuItemFirst,
                index === MENU_ITEMS.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleMenuPress(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={22} color={Colors.accent} />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.white} />
          <Text style={styles.logoutButtonText}>Logout</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userName: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },
  menuSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: FontSizes.base,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
