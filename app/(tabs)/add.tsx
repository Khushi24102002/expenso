import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { TransactionType, ExpenseCategory, IncomeSource, Mood } from '@/types/transaction';
import { addTransaction } from '@/lib/transactions';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Food', 'Travel', 'Shopping', 'Bills', 'Fun', 'Other'];
const INCOME_SOURCES: IncomeSource[] = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const MOODS: Mood[] = ['😊', '😐', '😢', '😤', '🎉'];

export default function AddScreen() {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('');
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!category) {
      Alert.alert(
        'Missing Category',
        type === 'expense' ? 'Please select a category' : 'Please select an income source'
      );
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        source: type === 'income' ? category : undefined,
        note: note || undefined,
        mood: type === 'expense' && mood ? mood : undefined,
      });

      setAmount('');
      setCategory('');
      setNote('');
      setMood('');

      router.push('/(tabs)');
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Transaction</Text>
          <Text style={styles.subtitle}>Track your money flow</Text>
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
            onPress={() => {
              setType('expense');
              setCategory('');
            }}>
            <Text
              style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
            onPress={() => {
              setType('income');
              setCategory('');
              setMood('');
            }}>
            <Text
              style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountField}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            {type === 'expense' ? 'Category' : 'Income Source'}
          </Text>
          <View style={styles.optionsGrid}>
            {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_SOURCES).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, category === option && styles.optionButtonActive]}
                onPress={() => setCategory(option)}>
                <Text
                  style={[
                    styles.optionButtonText,
                    category === option && styles.optionButtonTextActive,
                  ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {type === 'expense' && (
          <View style={styles.section}>
            <Text style={styles.label}>How are you feeling? (Optional)</Text>
            <View style={styles.moodSelector}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.moodButton, mood === m && styles.moodButtonActive]}
                  onPress={() => setMood(mood === m ? '' : m)}>
                  <Text style={styles.moodEmoji}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.background,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  currencySymbol: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
    paddingVertical: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  optionButtonTextActive: {
    color: Colors.background,
  },
  moodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  moodButton: {
    width: 56,
    height: 56,
    backgroundColor: Colors.cardBackground,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  moodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  moodEmoji: {
    fontSize: 28,
  },
  noteInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Colors.background,
  },
  bottomSpacer: {
    height: 40,
  },
});
