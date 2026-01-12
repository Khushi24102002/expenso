export type TransactionType = 'expense' | 'income';

export type ExpenseCategory = 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Fun' | 'Other';
export type IncomeSource = 'Salary' | 'Freelance' | 'Investment' | 'Gift' | 'Other';

export type Mood = '😊' | '😐' | '😢' | '😤' | '🎉';

export interface Transaction {
  id: string;
  user_id?: string | null;
  type: TransactionType;
  amount: number;
  category: string;
  source?: string | null;
  note?: string | null;
  mood?: string | null;
  created_at: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  source?: string;
  note?: string;
  mood?: string;
}
