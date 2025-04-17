/*
        # Simplify Household SELECT Policy

        This migration simplifies the SELECT RLS policy on the `households` table to troubleshoot an infinite recursion error during INSERT operations.

        1. **Policy Change**:
           - Replaces the existing SELECT policy (`Allow household select for owner or member`).
           - The new, simplified policy (`Allow household select for owner ONLY`) allows users to select households *only* if they are the owner (`owner_id = auth.uid()`).
           - The check for membership via the `household_members` table (`EXISTS (...)`) is temporarily removed.

        2. **Purpose**:
           - To determine if the `EXISTS` clause in the original SELECT policy was interacting with the INSERT policy check, causing the recursion.
           - If household creation succeeds after this change, it confirms the interaction was the issue. We may need to find a different way to grant SELECT access to members later.

        3. **Security**:
           - Temporarily restricts visibility of households to only their owners. Members will not be able to see households they belong to until this policy is potentially revised again.
      */

      -- Ensure RLS is enabled (redundant but safe)
      ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

      -- Drop the potentially problematic policy
      DROP POLICY IF EXISTS "Allow household select for owner or member" ON public.households;
      -- Drop the new policy name too, in case of reruns
      DROP POLICY IF EXISTS "Allow household select for owner ONLY" ON public.households;

      -- Define the SIMPLIFIED SELECT Policy (Owner Only)
      CREATE POLICY "Allow household select for owner ONLY"
        ON public.households
        FOR SELECT
        TO authenticated
        USING ( owner_id = auth.uid() );

      -- Keep other policies (INSERT, UPDATE, DELETE) as they were
      -- INSERT Policy
      DROP POLICY IF EXISTS "Allow household insert for owner" ON public.households;
      CREATE POLICY "Allow household insert for owner"
        ON public.households
        FOR INSERT
        TO authenticated
        WITH CHECK ( owner_id = auth.uid() );

      -- UPDATE Policy
      DROP POLICY IF EXISTS "Allow household update for owner" ON public.households;
      CREATE POLICY "Allow household update for owner"
        ON public.households
        FOR UPDATE
        TO authenticated
        USING ( owner_id = auth.uid() )
        WITH CHECK ( owner_id = auth.uid() );

      -- DELETE Policy
      DROP POLICY IF EXISTS "Allow household delete for owner" ON public.households;
      CREATE POLICY "Allow household delete for owner"
        ON public.households
        FOR DELETE
        TO authenticated
        USING ( owner_id = auth.uid() );
