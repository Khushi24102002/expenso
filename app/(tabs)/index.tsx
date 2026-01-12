import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Transaction } from '@/types/transaction';
import { getTransactions, calculateBalance, getCategorySpending } from '@/lib/transactions';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
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

  const { balance, totalIncome, totalExpense } = calculateBalance(transactions);
  const categoryData = getCategorySpending(transactions);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDailySpending = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return startOfDay(date);
    });

    return last7Days.map((date) => {
      const dayExpenses = transactions.filter(
        (t) =>
          t.type === 'expense' &&
          isAfter(new Date(t.created_at), date) &&
          new Date(t.created_at) < new Date(date.getTime() + 24 * 60 * 60 * 1000)
      );
      return dayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
    });
  };

  const dailySpending = getDailySpending();
  const recentTransactions = transactions.slice(0, 5);

  const pieChartData = categoryData.map((item) => ({
    name: item.category,
    population: item.amount,
    color: item.color,
    legendFontColor: Colors.textSecondary,
    legendFontSize: 12,
  }));

  const getAIInsight = () => {
    const todayExpenses = transactions.filter((t) => {
      const today = startOfDay(new Date());
      return t.type === 'expense' && isAfter(new Date(t.created_at), today);
    });

    const todayTotal = todayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);

    if (todayTotal === 0) {
      return "Great job! You haven't spent anything today. 🌟";
    }

    if (todayTotal > 100) {
      return `Whoa there! You've spent $${todayTotal.toFixed(0)} today. Maybe time to slow down? 😅`;
    }

    const topCategory = categoryData[0]?.category || 'nothing';
    return `You're spending most on ${topCategory}. Keep an eye on that! 👀`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}!</Text>
        <Text style={styles.subtitle}>Here's your financial overview</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={[styles.balanceAmount, balance < 0 && styles.negativeBalance]}>
          ${Math.abs(balance).toFixed(2)}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <TrendingUp size={16} color={Colors.income} />
            <Text style={styles.balanceItemLabel}>Income</Text>
            <Text style={styles.incomeText}>${totalIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceItem}>
            <TrendingDown size={16} color={Colors.expense} />
            <Text style={styles.balanceItemLabel}>Expenses</Text>
            <Text style={styles.expenseText}>${totalExpense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Sparkles size={20} color={Colors.primary} />
          <Text style={styles.insightTitle}>AI Insight</Text>
        </View>
        <Text style={styles.insightText}>{getAIInsight()}</Text>
      </View>

      {dailySpending.some((v) => v > 0) && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Last 7 Days Spending</Text>
          <LineChart
            data={{
              labels: ['', '', '', '', '', '', ''],
              datasets: [{ data: dailySpending.length > 0 ? dailySpending : [0] }],
            }}
            width={width - 48}
            height={180}
            chartConfig={{
              backgroundColor: Colors.background,
              backgroundGradientFrom: Colors.cardBackground,
              backgroundGradientTo: Colors.cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(91, 140, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: Colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {categoryData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={pieChartData}
            width={width - 48}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Add your first transaction to get started!</Text>
          </View>
        ) : (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
                <Text style={styles.transactionDate}>
                  {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                </Text>
                {transaction.note && (
                  <Text style={styles.transactionNote}>{transaction.note}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                ]}>
                {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>

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
  greeting: {
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
  balanceCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 48,
    color: Colors.background,
    marginTop: 4,
  },
  negativeBalance: {
    color: Colors.error,
  },
  balanceRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  balanceItemLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  incomeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.background,
    marginTop: 2,
  },
  expenseText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.background,
    marginTop: 2,
  },
  insightCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  insightText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  chartCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chartTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
  },
  recentSection: {
    padding: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  transactionLeft: {
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
    marginTop: 2,
  },
  transactionNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
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
  bottomSpacer: {
    height: 40,
  },
});
