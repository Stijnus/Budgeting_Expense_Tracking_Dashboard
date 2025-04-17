/*
      # Define All Household RLS Policies (DROP/CREATE)

      This migration explicitly defines all standard CRUD RLS policies for the `households` table using `DROP POLICY IF EXISTS` followed by `CREATE POLICY`. This avoids potential syntax errors encountered with `CREATE OR REPLACE POLICY` in some environments.

      1. **Policy Changes**:
         - **DROP**: Explicitly drops the target policies if they exist using their specific names.
         - **INSERT**: Creates the policy. Allows authenticated users to insert a household only if `owner_id` matches their `auth.uid()`.
         - **SELECT**: Creates the policy. Allows users to select households they own (`owner_id = auth.uid()`) OR households they are a member of (checked via `household_members` table using `EXISTS`).
         - **UPDATE**: Creates the policy. Allows only the owner (`owner_id = auth.uid()`) to update household details.
         - **DELETE**: Creates the policy. Allows only the owner (`owner_id = auth.uid()`) to delete a household.

      2. **Security**:
         - Ensures basic ownership and membership rules for accessing and modifying households.
         - Aims to eliminate RLS-based infinite recursion.
    */

    -- Ensure RLS is enabled (redundant but safe)
    ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies first to avoid "already exists" errors
    DROP POLICY IF EXISTS "Allow household insert for owner" ON public.households;
    DROP POLICY IF EXISTS "Allow household select for owner or member" ON public.households;
    DROP POLICY IF EXISTS "Allow household update for owner" ON public.households;
    DROP POLICY IF EXISTS "Allow household delete for owner" ON public.households;
    -- Add any other potential policy names you might have used previously here as well

    -- Define INSERT Policy
    CREATE POLICY "Allow household insert for owner"
      ON public.households
      FOR INSERT
      TO authenticated
      WITH CHECK ( owner_id = auth.uid() );

    -- Define SELECT Policy (Owner or Member)
    CREATE POLICY "Allow household select for owner or member"
      ON public.households
      FOR SELECT
      TO authenticated
      USING (
        (owner_id = auth.uid()) OR
        EXISTS (
          SELECT 1
          FROM public.household_members hm
          WHERE hm.household_id = households.id AND hm.user_id = auth.uid()
        )
      );

    -- Define UPDATE Policy (Owner Only)
    CREATE POLICY "Allow household update for owner"
      ON public.households
      FOR UPDATE
      TO authenticated
      USING ( owner_id = auth.uid() )
      WITH CHECK ( owner_id = auth.uid() ); -- Also check on the new data

    -- Define DELETE Policy (Owner Only)
    CREATE POLICY "Allow household delete for owner"
      ON public.households
      FOR DELETE
      TO authenticated
      USING ( owner_id = auth.uid() );
