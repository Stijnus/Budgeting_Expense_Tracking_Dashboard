/*
      # Link Financial Tables to Households

      This migration adds an optional `household_id` foreign key column to the `expenses`, `incomes`, and `budgets` tables. This allows financial records to be associated with a specific household, enabling shared budgeting features.

      1.  **Modified Tables**
          *   `expenses`: Added `household_id` (uuid, nullable, fk->households).
          *   `incomes`: Added `household_id` (uuid, nullable, fk->households).
          *   `budgets`: Added `household_id` (uuid, nullable, fk->households).

      2.  **Indexes**
          *   Added indexes on the new `household_id` columns for performance.

      3.  **Security (RLS Updates)**
          *   **Expenses:**
              *   SELECT: Allow users to see their own expenses OR expenses belonging to households they are members of.
              *   INSERT: Allow users to insert expenses for themselves (household_id is NULL) OR for a household they are a member of.
              *   UPDATE: Allow users to update their own expenses OR expenses belonging to households they are members of (cannot change household_id easily).
              *   DELETE: Allow users to delete their own expenses OR expenses belonging to households they are members of.
          *   **Incomes:** (Similar logic as Expenses)
              *   SELECT: Allow users to see their own incomes OR incomes belonging to households they are members of.
              *   INSERT: Allow users to insert incomes for themselves OR for a household they are a member of.
              *   UPDATE: Allow users to update their own incomes OR incomes belonging to households they are members of.
              *   DELETE: Allow users to delete their own incomes OR incomes belonging to households they are members of.
          *   **Budgets:** (Similar logic as Expenses)
              *   SELECT: Allow users to see their own budgets OR budgets belonging to households they are members of.
              *   INSERT: Allow users to insert budgets for themselves OR for a household they are a member of.
              *   UPDATE: Allow users to update their own budgets OR budgets belonging to households they are members of.
              *   DELETE: Allow users to delete their own budgets OR budgets belonging to households they are members of.

      4.  **Important Notes**
          *   The `household_id` is nullable to support personal expenses/incomes/budgets not tied to a household.
          *   RLS policies are updated to check for household membership when `household_id` is not null.
    */

    -- Add household_id column to expenses
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'household_id'
      ) THEN
        ALTER TABLE public.expenses ADD COLUMN household_id uuid NULL REFERENCES public.households(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_expenses_household_id ON public.expenses(household_id);
        RAISE NOTICE 'Column household_id added to expenses table.';
      ELSE
        RAISE NOTICE 'Column household_id already exists in expenses table.';
      END IF;
    END $$;

    -- Add household_id column to incomes
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'incomes' AND column_name = 'household_id'
      ) THEN
        ALTER TABLE public.incomes ADD COLUMN household_id uuid NULL REFERENCES public.households(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_incomes_household_id ON public.incomes(household_id);
        RAISE NOTICE 'Column household_id added to incomes table.';
      ELSE
        RAISE NOTICE 'Column household_id already exists in incomes table.';
      END IF;
    END $$;

    -- Add household_id column to budgets
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'household_id'
      ) THEN
        ALTER TABLE public.budgets ADD COLUMN household_id uuid NULL REFERENCES public.households(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_budgets_household_id ON public.budgets(household_id);
        RAISE NOTICE 'Column household_id added to budgets table.';
      ELSE
        RAISE NOTICE 'Column household_id already exists in budgets table.';
      END IF;
    END $$;


    -- Helper function to check household membership
    CREATE OR REPLACE FUNCTION public.is_household_member(hid uuid, uid uuid)
    RETURNS boolean
    LANGUAGE sql
    STABLE -- Indicates the function cannot modify the database and always returns the same results for the same arguments within a single transaction
    AS $$
      SELECT EXISTS (
        SELECT 1
        FROM public.household_members hm
        WHERE hm.household_id = hid AND hm.user_id = uid
      );
    $$;

    -- Grant execute permission on the helper function
    GRANT EXECUTE ON FUNCTION public.is_household_member(uuid, uuid) TO authenticated;


    -- Update RLS Policies for expenses
    ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY; -- Disable temporarily to update policies

    DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Users can manage own OR household expenses" ON public.expenses; -- Drop new policy if it exists

    CREATE POLICY "Users can manage own OR household expenses"
        ON public.expenses
        FOR ALL -- Covers SELECT, INSERT, UPDATE, DELETE
        TO authenticated
        USING (
            (user_id = auth.uid() AND household_id IS NULL) -- Own personal expense
            OR
            (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid())) -- Belongs to a household they are a member of
        )
        WITH CHECK (
            (user_id = auth.uid() AND household_id IS NULL) -- Inserting/Updating own personal expense
            OR
            (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid())) -- Inserting/Updating expense for a household they are a member of
            -- Note: This check prevents easily changing an expense from personal to household or vice-versa without more complex logic/permissions.
            -- It also assumes the user_id is correctly set to the current user when inserting.
        );

    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;


    -- Update RLS Policies for incomes
    ALTER TABLE public.incomes DISABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage their own income records" ON public.incomes;
    DROP POLICY IF EXISTS "Users can view their own income" ON public.incomes;
    DROP POLICY IF EXISTS "Users can insert their own income" ON public.incomes;
    DROP POLICY IF EXISTS "Users can update their own income" ON public.incomes;
    DROP POLICY IF EXISTS "Users can delete their own income" ON public.incomes;
    DROP POLICY IF EXISTS "Users can manage own OR household incomes" ON public.incomes; -- Drop new policy if it exists

    CREATE POLICY "Users can manage own OR household incomes"
        ON public.incomes
        FOR ALL
        TO authenticated
        USING (
            (user_id = auth.uid() AND household_id IS NULL)
            OR
            (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid()))
        )
        WITH CHECK (
            (user_id = auth.uid() AND household_id IS NULL)
            OR
            (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid()))
        );

    ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;


    -- Update RLS Policies for budgets
    ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
    DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
    DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
    DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
    DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
    DROP POLICY IF EXISTS "Users can manage own OR household budgets" ON public.budgets; -- Drop new policy if it exists

    CREATE POLICY "Users can manage own OR household budgets"
        ON public.budgets
        FOR ALL
        TO authenticated
        USING (
            (user_id = auth.uid() AND household_id IS NULL)
            OR
            (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid()))
        )
        WITH CHECK (
            (user_id = auth.uid() AND household_id IS NULL)
            OR
            (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid()))
        );

    ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;