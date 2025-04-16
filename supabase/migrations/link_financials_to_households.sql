```sql
/*
  # Link Financial Data to Households

  This migration adds a `household_id` column to the `expenses`, `incomes`, and `budgets` tables, allowing these records to be associated with a specific household. It also updates the Row Level Security (RLS) policies for these tables to grant access based on household membership.

  1. Schema Changes
     - Added `household_id` (uuid, nullable, foreign key -> households.id) to `expenses`.
     - Added `household_id` (uuid, nullable, foreign key -> households.id) to `incomes`.
     - Added `household_id` (uuid, nullable, foreign key -> households.id) to `budgets`.
     - Foreign key constraints use `ON DELETE SET NULL`. If a household is deleted, associated financial records become personal (household_id is set to NULL) instead of being deleted.

  2. Indexing
     - Added indexes on the new `household_id` columns for faster filtering.

  3. Security (RLS Policy Updates)
     - **Expenses:**
       - Replaced the old "Users can manage their own expenses" policy with:
         - "Users can manage personal and household expenses": Allows SELECT, INSERT, UPDATE, DELETE if the record is personal (`user_id = auth.uid()` and `household_id IS NULL`) OR if the record belongs to a household the user is a member of (`household_id IS NOT NULL` and the user is in `household_members`).
         - The `WITH CHECK` clause ensures users can only insert/update records as personal or belonging to a household they are a member of.
     - **Incomes:**
       - Replaced the old "Users can manage their own income" policy with:
         - "Users can manage personal and household income": Similar logic as expenses, allowing access to personal income or income belonging to households they are members of.
     - **Budgets:**
       - Replaced the old "Users can manage their own budgets" policy with:
         - "Users can manage personal and household budgets": Similar logic, allowing access to personal budgets or budgets belonging to households they are members of.

  4. Notes
     - Records with `household_id = NULL` are considered personal records, only accessible by the `user_id`.
     - Records with a non-null `household_id` are considered shared within that household.
     - The `user_id` column still indicates who *created* the record, even if it's a household record.
*/

-- ==== Add household_id to expenses ====

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN household_id uuid NULL;
    COMMENT ON COLUMN public.expenses.household_id IS 'Links the expense to a specific household, if applicable.';
  END IF;
END $$;

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'expenses' AND constraint_name = 'expenses_household_id_fkey'
  ) THEN
    ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE SET NULL; -- Set to NULL if household is deleted
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_household_id ON public.expenses(household_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_household ON public.expenses(user_id, household_id); -- Index for combined queries

-- Update RLS policy for expenses
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses; -- Drop old policy
DROP POLICY IF EXISTS "Users can manage personal and household expenses" ON public.expenses; -- Drop new policy if script re-run
CREATE POLICY "Users can manage personal and household expenses"
ON public.expenses
FOR ALL -- SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (
  -- Case 1: It's a personal expense (user created it, no household linked)
  (auth.uid() = user_id AND household_id IS NULL)
  OR
  -- Case 2: It's a household expense and the user is a member of that household
  (household_id IS NOT NULL AND household_id IN (
    SELECT hm.household_id FROM public.household_members hm WHERE hm.user_id = auth.uid()
  ))
)
WITH CHECK (
  -- On INSERT/UPDATE, ensure the user is the creator AND
  -- either it's personal OR they are a member of the target household.
  auth.uid() = user_id AND (
    household_id IS NULL -- Allow making it personal
    OR
    household_id IN ( -- Allow assigning to a household they are a member of
      SELECT hm.household_id FROM public.household_members hm WHERE hm.user_id = auth.uid()
    )
  )
);


-- ==== Add household_id to incomes ====

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incomes' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE public.incomes ADD COLUMN household_id uuid NULL;
    COMMENT ON COLUMN public.incomes.household_id IS 'Links the income record to a specific household, if applicable.';
  END IF;
END $$;

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'incomes' AND constraint_name = 'incomes_household_id_fkey'
  ) THEN
    ALTER TABLE public.incomes
    ADD CONSTRAINT incomes_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_incomes_household_id ON public.incomes(household_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_household ON public.incomes(user_id, household_id);

-- Update RLS policy for incomes
DROP POLICY IF EXISTS "Users can manage their own income" ON public.incomes; -- Drop old policy
DROP POLICY IF EXISTS "Users can manage personal and household income" ON public.incomes; -- Drop new policy if script re-run
CREATE POLICY "Users can manage personal and household income"
ON public.incomes
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id AND household_id IS NULL)
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT hm.household_id FROM public.household_members hm WHERE hm.user_id = auth.uid()
  ))
)
WITH CHECK (
  auth.uid() = user_id AND (
    household_id IS NULL
    OR
    household_id IN (
      SELECT hm.household_id FROM public.household_members hm WHERE hm.user_id = auth.uid()
    )
  )
);


-- ==== Add household_id to budgets ====

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN household_id uuid NULL;
    COMMENT ON COLUMN public.budgets.household_id IS 'Links the budget to a specific household, if applicable.';
  END IF;
END $$;

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'budgets' AND constraint_name = 'budgets_household_id_fkey'
  ) THEN
    ALTER TABLE public.budgets
    ADD CONSTRAINT budgets_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_budgets_household_id ON public.budgets(household_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_household ON public.budgets(user_id, household_id);

-- Update RLS policy for budgets
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets; -- Drop old policy
DROP POLICY IF EXISTS "Users can manage personal and household budgets" ON public.budgets; -- Drop new policy if script re-run
CREATE POLICY "Users can manage personal and household budgets"
ON public.budgets
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id AND household_id IS NULL)
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT hm.household_id FROM public.household_members hm WHERE hm.user_id = auth.uid()
  ))
)
WITH CHECK (
  auth.uid() = user_id AND (
    household_id IS NULL
    OR
    household_id IN (
      SELECT hm.household_id FROM public.household_members hm WHERE hm.user_id = auth.uid()
    )
  )
);

-- Note: The unique constraint on budgets (`unique_user_category_start_date`)
-- might need adjustment if households can have overlapping budgets for the same category/period.
-- For now, we assume a budget is unique for a user OR a household for a given category/start_date.
-- Let's add household_id to the unique constraint.

-- Drop the old constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'budgets'
          AND constraint_name = 'unique_user_category_start_date'
          AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE public.budgets DROP CONSTRAINT unique_user_category_start_date;
    END IF;
END $$;

-- Add the new unique constraint including household_id (NULLs are distinct by default)
ALTER TABLE public.budgets
ADD CONSTRAINT unique_budget_scope_category_start_date
UNIQUE (user_id, household_id, category_id, start_date);

-- Comment on the new constraint
COMMENT ON CONSTRAINT unique_budget_scope_category_start_date ON public.budgets IS 'Ensures budget uniqueness for a user/household, category (or overall), and start date.';

    ```