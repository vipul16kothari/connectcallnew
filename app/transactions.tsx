import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { MOCK_TRANSACTIONS } from '@/data/mockData';
import { Transaction } from '@/types/host';
import { Ionicons } from '@expo/vector-icons';

export default function TransactionsScreen() {
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
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Transactions List */}
      <FlatList
        data={MOCK_TRANSACTIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPositive = transaction.amount > 0;
  const icon = transaction.type === 'purchase' ? 'add-circle' : 'call';
  const iconColor = isPositive ? Colors.success : Colors.secondary;

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(transaction.timestamp)}</Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: isPositive ? Colors.success : Colors.secondary },
        ]}
      >
        {isPositive ? '+' : ''}
        {transaction.amount}
      </Text>
    </View>
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
  listContent: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: FontSizes.xs,
    color: Colors.text.light,
  },
  amount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
});
