/*
        # Define RLS Policies for household_members

        This migration establishes Row Level Security policies for the `household_members` table, complementing the policies on the `households` table.

        1. **New Table Policies**: `household_members`
           - **ENABLE RLS**: Activates Row Level Security on the table.
           - **SELECT**:
             - Allows users to see their *own* membership record (`user_id = auth.uid()`).
             - Allows owners of a household to see *all* membership records for that household (checks `households.owner_id`).
           - **INSERT**:
             - Allows the *owner* of a household to insert new members (including themselves during initial household creation). Checks `households.owner_id`.
           - **DELETE**:
             - Allows users to delete their *own* membership record (i.e., leave a household).
             - Allows the *owner* of a household to delete *other* members' records from that household.

        2. **Security**:
           - Ensures users can only manage memberships according to their role (owner vs. member) within a specific household.
           - Aims to prevent the RLS recursion error seen during household creation by defining clear access rules for the second part of the creation process (adding the owner to the members table).
      */

      -- 1. Enable RLS on the household_members table
      ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

      -- 2. SELECT Policy: Users can see their own membership, Owners can see all members of their household.
      DROP POLICY IF EXISTS "Allow member select for self or owner" ON public.household_members;
      CREATE POLICY "Allow member select for self or owner"
        ON public.household_members
        FOR SELECT
        TO authenticated
        USING (
          (user_id = auth.uid()) -- User can see their own membership record
          OR
          EXISTS ( -- Owner can see all members of households they own
            SELECT 1
            FROM public.households h
            WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
          )
        );

      -- 3. INSERT Policy: Owners can insert members into their own household.
      -- This covers the owner adding themselves during creation AND adding other members later.
      DROP POLICY IF EXISTS "Allow owner to insert members" ON public.household_members;
      CREATE POLICY "Allow owner to insert members"
        ON public.household_members
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.households h
            WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
          )
        );

      -- 4. DELETE Policy: Users can delete their own membership (leave), Owners can remove others.
      DROP POLICY IF EXISTS "Allow member delete for self or owner" ON public.household_members;
      CREATE POLICY "Allow member delete for self or owner"
        ON public.household_members
        FOR DELETE
        TO authenticated
        USING (
          (user_id = auth.uid()) -- User can delete their own membership (leave)
          OR
          EXISTS ( -- Owner can delete members from households they own (UI prevents owner self-delete)
            SELECT 1
            FROM public.households h
            WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
          )
        );

      -- Note: UPDATE policy is omitted for now as role changes aren't implemented.
      -- If needed later, it would require similar owner checks.
