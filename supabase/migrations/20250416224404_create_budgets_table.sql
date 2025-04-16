/*
  # Create budgets table

  This migration adds the `budgets` table to track user-defined spending goals.

  1. New Tables
     - `budgets`
       - `id` (uuid, primary key): Unique identifier for the budget entry.
       - `user_id` (uuid, foreign key -> auth.users): Links the budget to the user who created it.
       - `category_id` (uuid, foreign key -> categories, nullable): Links the budget to a specific category. If NULL, it represents an overall budget for the period.
       - `amount` (numeric): The target budget amount (must be positive).
       - `start_date` (date): The start date of the budget period (e.g., '2024-07-01').
       - `end_date` (date): The end date of the budget period (e.g., '2024-07-31').
       - `created_at` (timestamptz): Timestamp of when the budget was created.
       - `updated_at` (timestamptz): Timestamp of the last update (automatically handled by trigger).

  2. Indexes
     - Index on `user_id` for efficient querying of user's budgets.
     - Index on `user_id`, `category_id`, `start_date`, `end_date` for faster lookups based on user, category, and period.

  3. Triggers
     - `handle_updated_at`: Automatically updates the `updated_at` timestamp whenever a row is modified.

  4. Security
     - Enable Row Level Security (RLS) on the `budgets` table.
     - Add policies:
       - "Users can manage their own budgets": Allows authenticated users to perform SELECT, INSERT, UPDATE, DELETE operations only on budgets linked to their `user_id`.

  5. Constraints
     - Foreign key constraints enforce relationships with `auth.users` and `categories`.
     - Check constraint ensures the `amount` is positive.
     - Check constraint ensures `end_date` is on or after `start_date`.
     - Unique constraint on (`user_id`, `category_id`, `start_date`) prevents duplicate budgets for the same user, category (or overall), and start date.

  6. Notes
     - The `category_id` being NULL signifies an overall budget goal for the specified period.
     - The `updated_at` trigger uses the standard `moddatetime` extension function.
*/

-- Ensure the moddatetime extension is enabled for the updated_at trigger
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- Create the budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid NULL REFERENCES public.categories(id) ON DELETE SET NULL, -- Allow setting category to NULL if deleted
    amount numeric NOT NULL CHECK (amount > 0),
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    CONSTRAINT end_date_after_start_date CHECK (end_date >= start_date),
    -- Prevent duplicate budgets for the same user, category (or overall), and start date
    CONSTRAINT unique_user_category_start_date UNIQUE (user_id, category_id, start_date)
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.budgets IS 'Stores user-defined spending budgets for specific categories or overall periods.';
COMMENT ON COLUMN public.budgets.user_id IS 'The user who owns this budget.';
COMMENT ON COLUMN public.budgets.category_id IS 'The category this budget applies to. NULL for overall budget.';
COMMENT ON COLUMN public.budgets.amount IS 'The target budget amount.';
COMMENT ON COLUMN public.budgets.start_date IS 'The first day of the budget period.';
COMMENT ON COLUMN public.budgets.end_date IS 'The last day of the budget period.';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category_period ON public.budgets(user_id, category_id, start_date, end_date);

-- Create the trigger function to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at'
  ) THEN
    CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime (updated_at);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets"
ON public.budgets
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
