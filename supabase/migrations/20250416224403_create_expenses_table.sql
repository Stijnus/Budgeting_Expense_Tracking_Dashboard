/*
  # Create Expenses Table

  This migration creates the `expenses` table to store individual expense records.

  1.  **New Tables**
      *   `expenses`
          *   `id` (uuid, primary key): Unique identifier for the expense.
          *   `user_id` (uuid, foreign key): Links to the authenticated user who recorded the expense.
          *   `category_id` (uuid, foreign key): Links to the category this expense belongs to. Can be NULL if uncategorized.
          *   `amount` (numeric): The monetary value of the expense. Must be positive.
          *   `description` (text): A brief description of the expense (optional).
          *   `expense_date` (date): The date the expense occurred. Defaults to the current date.
          *   `created_at` (timestamptz): Timestamp of when the expense record was created.

  2.  **Constraints**
      *   `amount` must be greater than 0.
      *   Foreign key constraint to `categories` table (on delete set null, allowing expenses to remain if a category is deleted).
      *   Foreign key constraint to `auth.users` table (on delete cascade, removing expenses if the user is deleted).

  3.  **Indexes**
      *   Index on `user_id` for efficient querying of user-specific expenses.
      *   Index on `category_id`.
      *   Index on `expense_date`.

  4.  **Security**
      *   Enable Row Level Security (RLS) on the `expenses` table.
      *   Policy: Authenticated users can perform CRUD operations on their *own* expenses.
      *   Policy: Deny all access to unauthenticated users.
*/

-- 1. Create Table
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL, -- Allow uncategorized or keep expense if category deleted
    amount numeric(10, 2) NOT NULL CHECK (amount > 0), -- Example: Up to 99,999,999.99
    description text DEFAULT '',
    expense_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Add Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

-- 3. Enable RLS and Add Policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users full control over their own expenses
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
CREATE POLICY "Users can manage their own expenses"
    ON expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Optional: Explicitly deny access to unauthenticated users
-- CREATE POLICY "Deny access to unauthenticated users for expenses"
--     ON expenses
--     FOR ALL
--     TO public
--     USING (false);

COMMENT ON TABLE expenses IS 'Stores individual expense records.';
COMMENT ON COLUMN expenses.user_id IS 'The user who recorded this expense.';
COMMENT ON COLUMN expenses.category_id IS 'The category this expense belongs to (optional).';
COMMENT ON COLUMN expenses.amount IS 'Monetary value of the expense.';
COMMENT ON COLUMN expenses.description IS 'Optional description of the expense.';
COMMENT ON COLUMN expenses.expense_date IS 'Date the expense occurred.';
