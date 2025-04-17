/*
      # Define All Household RLS Policies

      This migration explicitly defines all standard CRUD RLS policies for the `households` table to prevent potential infinite recursion issues, particularly from complex SELECT policies.

      1. **Policy Changes**:
         - **INSERT**: Replaces the existing policy. Allows authenticated users to insert a household only if `owner_id` matches their `auth.uid()`.
         - **SELECT**: Replaces any existing policy. Allows users to select households they own (`owner_id = auth.uid()`) OR households they are a member of (checked via `household_members` table using `EXISTS`).
         - **UPDATE**: Replaces any existing policy. Allows only the owner (`owner_id = auth.uid()`) to update household details (like the name).
         - **DELETE**: Replaces any existing policy. Allows only the owner (`owner_id = auth.uid()`) to delete a household.

      2. **Security**:
         - Ensures basic ownership and membership rules for accessing and modifying households.
         - Aims to eliminate RLS-based infinite recursion.
    */

    -- Ensure RLS is enabled (redundant but safe)
    ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies (using CREATE OR REPLACE handles this, but explicit drops can be clearer)
    DROP POLICY IF EXISTS "Users can insert households for themselves" ON public.households;
    DROP POLICY IF EXISTS "Users can view own households" ON public.households;
    DROP POLICY IF EXISTS "Users can view households they are members of" ON public.households;
    DROP POLICY IF EXISTS "Household members can view their household" ON public.households;
    DROP POLICY IF EXISTS "Owners can update their households" ON public.households;
    DROP POLICY IF EXISTS "Owners can delete their households" ON public.households;
    -- Add any other potential policy names you might have used

    -- Define INSERT Policy (Corrected Version)
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
