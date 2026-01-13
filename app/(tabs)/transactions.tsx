import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Transaction } from '@/types/transaction';
import { getTransactions, deleteTransaction } from '@/lib/transactions';
import { format } from 'date-fns';

type SortBy = 'date' | 'category' | 'source';
type SortOrder = 'asc' | 'desc';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const getSortedTransactions = () => {
    const sorted = [...transactions];

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'date') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      } else if (sortBy === 'category') {
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
      } else if (sortBy === 'source') {
        aValue = (a.source || a.category).toLowerCase();
        bValue = (b.source || b.category).toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleSortChange = (newSort: SortBy) => {
    if (sortBy === newSort) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSort);
      setSortOrder('desc');
    }
    setShowSortMenu(false);
  };

  const sortedTransactions = getSortedTransactions();

  const getSortLabel = () => {
    const labels: { [key in SortBy]: string } = {
      date: 'Date',
      category: 'Category',
      source: 'Source',
    };
    return labels[sortBy];
  };

  const renderTransaction = (transaction: Transaction) => (
    <View key={transaction.id} style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionCategory}>{transaction.category}</Text>
          <Text style={styles.transactionDate}>
            {format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}
          </Text>
          {transaction.note && <Text style={styles.transactionNote}>{transaction.note}</Text>}
          {transaction.mood && <Text style={styles.moodTag}>{transaction.mood}</Text>}
        </View>
        <View style={styles.amountSection}>
          <Text
            style={[
              styles.transactionAmount,
              transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
            ]}>
            {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
          </Text>
          <Text
            style={[
              styles.transactionType,
              transaction.type === 'income' ? styles.incomeType : styles.expenseType,
            ]}>
            {transaction.type === 'income' ? 'Income' : 'Expense'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(transaction.id)}>
        <Trash2 size={18} color={Colors.error} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>All Transactions</Text>
        <Text style={styles.subtitle}>
          {sortedTransactions.length} {sortedTransactions.length === 1 ? 'transaction' : 'transactions'}
        </Text>
      </View>

      <View style={styles.sortSection}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => handleSortChange('date')}>
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'date' && styles.sortButtonTextActive,
              ]}>
              Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'category' && styles.sortButtonActive]}
            onPress={() => handleSortChange('category')}>
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'category' && styles.sortButtonTextActive,
              ]}>
              Category {sortBy === 'category' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'source' && styles.sortButtonActive]}
            onPress={() => handleSortChange('source')}>
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'source' && styles.sortButtonTextActive,
              ]}>
              Source {sortBy === 'source' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {sortedTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Start by adding an expense or income</Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          {sortedTransactions.map((transaction) => renderTransaction(transaction))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sortSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sortLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  sortButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sortButtonTextActive: {
    color: Colors.background,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  transactionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  transactionDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  transactionNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  moodTag: {
    fontSize: 14,
    marginTop: 6,
  },
  amountSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  transactionAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
  },
  incomeAmount: {
    color: Colors.income,
  },
  expenseAmount: {
    color: Colors.expense,
  },
  transactionType: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    marginTop: 2,
  },
  incomeType: {
    color: Colors.income,
  },
  expenseType: {
    color: Colors.expense,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});
