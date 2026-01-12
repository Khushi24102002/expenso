import { supabase } from './supabase';
import { Transaction, TransactionInput } from '@/types/transaction';

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addTransaction(transaction: TransactionInput): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function calculateBalance(transactions: Transaction[]): {
  totalIncome: number;
  totalExpense: number;
  balance: number;
} {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export function getCategorySpending(transactions: Transaction[]): { category: string; amount: number; color: string }[] {
  const categoryColors: { [key: string]: string } = {
    Food: '#FF8B94',
    Travel: '#6FA8FF',
    Shopping: '#FFB86C',
    Bills: '#A8C5FF',
    Fun: '#C9A0DC',
    Other: '#9CA3AF',
  };

  const expenses = transactions.filter((t) => t.type === 'expense');
  const categoryMap: { [key: string]: number } = {};

  expenses.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
  });

  return Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      color: categoryColors[category] || '#9CA3AF',
    }))
    .sort((a, b) => b.amount - a.amount);
}
