/*
  # Create incomes table

  This migration adds the `incomes` table to allow users to track their income sources and amounts.

  1. New Tables
     - `incomes`
       - `id` (uuid, primary key): Unique identifier for the income entry.
       - `user_id` (uuid, foreign key -> auth.users): Links the income to the user who recorded it.
       - `amount` (numeric): The income amount (must be positive).
       - `description` (text, nullable): A description of the income (e.g., 'Salary July', 'Freelance Project X').
       - `income_date` (date): The date the income was received.
       - `created_at` (timestamptz): Timestamp of when the income record was created.
       - `updated_at` (timestamptz): Timestamp of the last update (automatically handled by trigger).

  2. Indexes
     - Index on `user_id` for efficient querying of user's income.
     - Index on `user_id`, `income_date` for faster lookups based on user and date.

  3. Triggers
     - `handle_updated_at`: Automatically updates the `updated_at` timestamp whenever a row is modified.

  4. Security
     - Enable Row Level Security (RLS) on the `incomes` table.
     - Add policies:
       - "Users can manage their own income": Allows authenticated users to perform SELECT, INSERT, UPDATE, DELETE operations only on income records linked to their `user_id`.

  5. Constraints
     - Foreign key constraint enforces relationship with `auth.users`.
     - Check constraint ensures the `amount` is positive.

  6. Notes
     - This initial version does not include income categories/sources, but that could be added later with a separate table and foreign key if needed.
*/

-- Ensure the moddatetime extension is enabled (should already be if budgets were added)
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- Create the incomes table
CREATE TABLE IF NOT EXISTS public.incomes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL CHECK (amount > 0),
    description text NULL,
    income_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.incomes IS 'Stores user income records.';
COMMENT ON COLUMN public.incomes.user_id IS 'The user who received the income.';
COMMENT ON COLUMN public.incomes.amount IS 'The amount of income received.';
COMMENT ON COLUMN public.incomes.description IS 'A description or source of the income.';
COMMENT ON COLUMN public.incomes.income_date IS 'The date the income was received.';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON public.incomes(user_id, income_date);

-- Create the trigger function to automatically update updated_at
-- Re-use the same trigger function if it exists, ensure it's applied
DROP TRIGGER IF EXISTS handle_updated_at ON public.incomes; -- Drop if exists from previous attempts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at'
  ) THEN
    CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.incomes
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime (updated_at);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Drop existing policy first if script is re-run for safety
DROP POLICY IF EXISTS "Users can manage their own income" ON public.incomes;
-- Create the policy
DROP POLICY IF EXISTS "Users can manage their own income" ON public.incomes;
CREATE POLICY "Users can manage their own income"
ON public.incomes
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
