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
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Calendar,
  Heart,
  Target,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Transaction } from '@/types/transaction';
import { getTransactions, calculateBalance } from '@/lib/transactions';
import { format, subDays, startOfDay, isAfter, differenceInDays } from 'date-fns';

export default function InsightsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [roastingEnabled, setRoastingEnabled] = useState(true);

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

  const getWeeklySpending = () => {
    const weekAgo = subDays(new Date(), 7);
    const weekExpenses = transactions.filter(
      (t) => t.type === 'expense' && isAfter(new Date(t.created_at), weekAgo)
    );
    return weekExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getDailyAverage = () => {
    if (transactions.length === 0) return 0;
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return 0;

    const total = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const oldestTransaction = new Date(expenses[expenses.length - 1].created_at);
    const days = Math.max(differenceInDays(new Date(), oldestTransaction), 1);

    return total / days;
  };

  const getMostExpensiveCategory = () => {
    const categoryTotals: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
      });

    return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  };

  const getMoodSpendingCorrelation = () => {
    const moodExpenses = transactions.filter((t) => t.type === 'expense' && t.mood);

    if (moodExpenses.length === 0) return null;

    const moodTotals: { [key: string]: { total: number; count: number } } = {};
    moodExpenses.forEach((t) => {
      if (t.mood) {
        if (!moodTotals[t.mood]) {
          moodTotals[t.mood] = { total: 0, count: 0 };
        }
        moodTotals[t.mood].total += Number(t.amount);
        moodTotals[t.mood].count += 1;
      }
    });

    const moodAverages = Object.entries(moodTotals).map(([mood, data]) => ({
      mood,
      average: data.total / data.count,
      count: data.count,
    }));

    return moodAverages.sort((a, b) => b.average - a.average);
  };

  const getSpendingStreak = () => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return 0;

    let streak = 0;
    let currentDate = startOfDay(new Date());

    for (let i = 0; i < 30; i++) {
      const hasExpense = expenses.some((t) => {
        const transactionDate = startOfDay(new Date(t.created_at));
        return transactionDate.getTime() === currentDate.getTime();
      });

      if (hasExpense) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const getWhyBrokeExplanation = () => {
    const { balance } = calculateBalance(transactions);
    const weeklySpending = getWeeklySpending();
    const topCategory = getMostExpensiveCategory();

    if (balance >= 0) {
      return "Actually, you're doing fine! Keep it up! 💪";
    }

    let explanation = "Alright, let's break this down... 🔍\n\n";

    if (topCategory) {
      explanation += `You're spending the most on ${topCategory[0]} ($${topCategory[1].toFixed(2)}). `;

      if (roastingEnabled) {
        if (topCategory[0] === 'Food') {
          explanation += "Maybe cook at home once in a while? 🍳";
        } else if (topCategory[0] === 'Shopping') {
          explanation += "Do you really need another thing? 🛍️";
        } else if (topCategory[0] === 'Fun') {
          explanation += "Living your best life, but at what cost? 🎉";
        }
      }
    }

    explanation += `\n\nYou've spent $${weeklySpending.toFixed(2)} this week. `;

    if (roastingEnabled && weeklySpending > 500) {
      explanation += "That's... a lot. Maybe slow down? 😅";
    }

    return explanation;
  };

  const weeklySpending = getWeeklySpending();
  const dailyAverage = getDailyAverage();
  const topCategory = getMostExpensiveCategory();
  const moodCorrelation = getMoodSpendingCorrelation();
  const streak = getSpendingStreak();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Insights</Text>
        <Text style={styles.subtitle}>Understanding your spending patterns</Text>
      </View>

      <TouchableOpacity
        style={styles.roastToggle}
        onPress={() => setRoastingEnabled(!roastingEnabled)}>
        <Text style={styles.roastToggleText}>
          Friendly Roasting: {roastingEnabled ? 'ON 🔥' : 'OFF 😌'}
        </Text>
      </TouchableOpacity>

      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <AlertCircle size={24} color={Colors.primary} />
          <Text style={styles.insightTitle}>Why Am I Broke?</Text>
        </View>
        <Text style={styles.insightText}>{getWhyBrokeExplanation()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Calendar size={24} color={Colors.primary} />
          <Text style={styles.statValue}>${weeklySpending.toFixed(0)}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>

        <View style={styles.statCard}>
          <TrendingUp size={24} color={Colors.primary} />
          <Text style={styles.statValue}>${dailyAverage.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Daily Average</Text>
        </View>

        <View style={styles.statCard}>
          <Target size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {topCategory && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Sparkles size={24} color={Colors.primary} />
            <Text style={styles.insightTitle}>Top Spending Category</Text>
          </View>
          <Text style={styles.categoryName}>{topCategory[0]}</Text>
          <Text style={styles.categoryAmount}>${topCategory[1].toFixed(2)}</Text>
          {roastingEnabled && (
            <Text style={styles.insightText}>
              {topCategory[0] === 'Food' && "You could start a restaurant with all that food money! 🍕"}
              {topCategory[0] === 'Shopping' && "Your closet called... it's full! 👗"}
              {topCategory[0] === 'Travel' && "Living that wanderlust life! ✈️"}
              {topCategory[0] === 'Fun' && "All fun and games until you check your balance! 🎮"}
              {topCategory[0] === 'Bills' && "Adulting is expensive, isn't it? 📄"}
              {topCategory[0] === 'Other' && "What exactly is 'Other'? 🤔"}
            </Text>
          )}
        </View>
      )}

      {moodCorrelation && moodCorrelation.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Heart size={24} color={Colors.primary} />
            <Text style={styles.insightTitle}>Mood & Spending</Text>
          </View>
          <Text style={styles.insightText}>
            Your spending habits by mood:
          </Text>
          {moodCorrelation.slice(0, 3).map((item) => (
            <View key={item.mood} style={styles.moodItem}>
              <Text style={styles.moodEmoji}>{item.mood}</Text>
              <View style={styles.moodInfo}>
                <Text style={styles.moodLabel}>{item.count} transactions</Text>
                <Text style={styles.moodAmount}>${item.average.toFixed(2)} avg</Text>
              </View>
            </View>
          ))}
          {roastingEnabled && moodCorrelation[0] && (
            <Text style={styles.insightText}>
              Looks like when you're {moodCorrelation[0].mood}, your wallet suffers the most! 💸
            </Text>
          )}
        </View>
      )}

      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Sparkles size={24} color={Colors.primary} />
          <Text style={styles.insightTitle}>Quick Tips</Text>
        </View>
        <Text style={styles.tipText}>• Track every expense, no matter how small</Text>
        <Text style={styles.tipText}>• Set a daily spending limit and stick to it</Text>
        <Text style={styles.tipText}>• Review your spending patterns weekly</Text>
        <Text style={styles.tipText}>• Note your mood to understand emotional spending</Text>
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
  roastToggle: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  roastToggleText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  insightCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  insightTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  insightText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  categoryName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  categoryAmount: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 32,
    color: Colors.primary,
    marginTop: 4,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  moodAmount: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  tipText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
});
