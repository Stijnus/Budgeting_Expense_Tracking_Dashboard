/*
      # Fix Household Insert Policy Recursion

      This migration fixes an infinite recursion issue in the RLS policy for inserting into the `households` table.

      1. **Policy Change**:
         - Replaces any existing INSERT policy for the `households` table with a corrected version.
         - The new policy ensures that authenticated users can only insert households where the `owner_id` column in the new row matches their own `auth.uid()`. This avoids recursive checks against the table itself.

      2. **Security**:
         - Maintains the security rule that only the authenticated user creating the household can set themselves as the initial owner.
    */

    -- Drop potentially conflicting old policies (optional, as CREATE OR REPLACE handles it)
    -- DROP POLICY IF EXISTS "Users can insert their own household" ON public.households;
    -- DROP POLICY IF EXISTS "Allow household insert for owner" ON public.households;

    -- Create or replace the INSERT policy with the correct, non-recursive check
    -- Allows authenticated users to insert a household if they set the owner_id to their own user ID.
    CREATE POLICY "Users can insert households for themselves"
      ON public.households
      FOR INSERT
      TO authenticated
      WITH CHECK ( owner_id = auth.uid() );

    -- Ensure RLS is enabled (it should be, but good practice to confirm)
    ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
