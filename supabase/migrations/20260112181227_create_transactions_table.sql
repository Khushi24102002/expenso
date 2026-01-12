/*
  # Create Expenso Transactions Table

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key) - Unique identifier for each transaction
      - `user_id` (uuid, nullable) - For future authentication integration
      - `type` (text) - Transaction type: 'expense' or 'income'
      - `amount` (numeric) - Transaction amount
      - `category` (text) - Category name (Food, Travel, Shopping, Bills, Fun, Other)
      - `source` (text, nullable) - Income source (for income transactions)
      - `note` (text, nullable) - Optional user note
      - `mood` (text, nullable) - Optional mood indicator (for expenses)
      - `created_at` (timestamptz) - Transaction timestamp
  
  2. Security
    - Enable RLS on `transactions` table
    - Add policy for unauthenticated access (V1 offline-first approach)
    - Future-ready for user-based authentication
  
  3. Indexes
    - Index on `created_at` for efficient date-based queries
    - Index on `type` for filtering expenses vs income
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  source text,
  note text,
  mood text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access for V1"
  ON transactions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access"
  ON transactions
  FOR ALL
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());