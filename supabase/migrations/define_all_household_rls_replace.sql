/*
      # Define All Household RLS Policies (Using REPLACE)

      This migration explicitly defines all standard CRUD RLS policies for the `households` table using `CREATE OR REPLACE POLICY` to prevent "already exists" errors and potential infinite recursion issues.

      1. **Policy Changes**:
         - **INSERT**: Creates or replaces the policy. Allows authenticated users to insert a household only if `owner_id` matches their `auth.uid()`.
         - **SELECT**: Creates or replaces the policy. Allows users to select households they own (`owner_id = auth.uid()`) OR households they are a member of (checked via `household_members` table using `EXISTS`).
         - **UPDATE**: Creates or replaces the policy. Allows only the owner (`owner_id = auth.uid()`) to update household details.
         - **DELETE**: Creates or replaces the policy. Allows only the owner (`owner_id = auth.uid()`) to delete a household.

      2. **Security**:
         - Ensures basic ownership and membership rules for accessing and modifying households.
         - Aims to eliminate RLS-based infinite recursion.
         - More robust against pre-existing policies with potentially different names.
    */

    -- Ensure RLS is enabled (redundant but safe)
    ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

    -- Define INSERT Policy (Using REPLACE)
    CREATE OR REPLACE POLICY "Allow household insert for owner"
      ON public.households
      FOR INSERT
      TO authenticated
      WITH CHECK ( owner_id = auth.uid() );

    -- Define SELECT Policy (Owner or Member - Using REPLACE)
    CREATE OR REPLACE POLICY "Allow household select for owner or member"
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

    -- Define UPDATE Policy (Owner Only - Using REPLACE)
    CREATE OR REPLACE POLICY "Allow household update for owner"
      ON public.households
      FOR UPDATE
      TO authenticated
      USING ( owner_id = auth.uid() )
      WITH CHECK ( owner_id = auth.uid() ); -- Also check on the new data

    -- Define DELETE Policy (Owner Only - Using REPLACE)
    CREATE OR REPLACE POLICY "Allow household delete for owner"
      ON public.households
      FOR DELETE
      TO authenticated
      USING ( owner_id = auth.uid() );
