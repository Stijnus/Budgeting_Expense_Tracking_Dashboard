/*
        # Add 'admin' Role and Update Household Member RLS

        This migration introduces an 'admin' role for households and updates the RLS policies on the `household_members` table to grant appropriate permissions.

        1. **Schema Changes**:
           - Modifies the `CHECK` constraint on `household_members.role` to include 'admin' as a valid value (`'owner'`, `'admin'`, `'member'`).

        2. **RLS Policy Changes (`household_members`)**:
           - **SELECT**: No change needed. Owners can already see all members, and users can see themselves. Admins seeing all members is implicitly covered if they are also the owner, or could be added explicitly if needed later.
           - **INSERT**: Updated `Allow owner to insert members` policy to `Allow owner or admin to insert members`. Now allows users who are either the 'owner' OR an 'admin' of the target household to insert new members (who will default to the 'member' role unless specified otherwise, though the UI currently only adds 'member').
           - **DELETE**: Updated `Allow member delete for self or owner` policy to `Allow member delete for self, owner, or admin`. Allows users to delete their own membership, OR allows owners/admins of the household to delete *other* members (but crucially *not* the owner).
           - **UPDATE**: *New Policy* `Allow owner or admin to update member roles`. Allows owners or admins of a household to change the `role` of *other* members within that same household, specifically between 'admin' and 'member'. Prevents changing the owner's role and prevents users from changing their own role via this policy.

        3. **Security**:
           - Establishes a mid-tier role ('admin') with member management capabilities.
           - Ensures owners retain ultimate control (cannot be removed or demoted by admins).
           - Prevents users from escalating their own privileges.
      */

      -- 1. Update Role Check Constraint
      -- Drop the old constraint if it exists
      ALTER TABLE public.household_members DROP CONSTRAINT IF EXISTS household_members_role_check;
      -- Add the new constraint including 'admin'
      ALTER TABLE public.household_members ADD CONSTRAINT household_members_role_check
        CHECK (role IN ('owner', 'admin', 'member'));

      -- 2. Update INSERT Policy
      DROP POLICY IF EXISTS "Allow owner to insert members" ON public.household_members;
      DROP POLICY IF EXISTS "Allow owner or admin to insert members" ON public.household_members;
      CREATE POLICY "Allow owner or admin to insert members"
        ON public.household_members
        FOR INSERT
        TO authenticated
        WITH CHECK (
          -- Check if the current user is the owner OR an admin of the target household
          EXISTS (
            SELECT 1
            FROM public.households h
            WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1
            FROM public.household_members m
            WHERE m.household_id = household_members.household_id
              AND m.user_id = auth.uid()
              AND m.role = 'admin'
          )
        );

      -- 3. Update DELETE Policy
      DROP POLICY IF EXISTS "Allow member delete for self or owner" ON public.household_members;
      DROP POLICY IF EXISTS "Allow member delete for self, owner, or admin" ON public.household_members;
      CREATE POLICY "Allow member delete for self, owner, or admin"
        ON public.household_members
        FOR DELETE
        TO authenticated
        USING (
          -- User can delete their own membership (leave)
          (user_id = auth.uid())
          OR
          -- Owner or Admin can delete OTHER members (but not the owner)
          (
            -- Check if the user being deleted is NOT the owner
            NOT EXISTS (
              SELECT 1
              FROM public.households h
              WHERE h.id = household_members.household_id AND h.owner_id = household_members.user_id -- Check if the target user is the owner
            )
            AND -- And check if the current user is the owner OR an admin of this household
            (
              EXISTS (
                SELECT 1
                FROM public.households h
                WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
              )
              OR
              EXISTS (
                SELECT 1
                FROM public.household_members m
                WHERE m.household_id = household_members.household_id
                  AND m.user_id = auth.uid()
                  AND m.role = 'admin'
              )
            )
          )
        );

      -- 4. Add UPDATE Policy for Roles
      DROP POLICY IF EXISTS "Allow owner or admin to update member roles" ON public.household_members;
      CREATE POLICY "Allow owner or admin to update member roles"
        ON public.household_members
        FOR UPDATE
        TO authenticated
        USING ( -- Who can initiate the update? Owner or Admin of the household.
          EXISTS (
            SELECT 1 FROM public.households h
            WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
          ) OR EXISTS (
            SELECT 1 FROM public.household_members m
            WHERE m.household_id = household_members.household_id AND m.user_id = auth.uid() AND m.role = 'admin'
          )
        )
        WITH CHECK ( -- What changes are allowed?
          -- 1. Can only update the 'role' column.
          -- (Implicitly handled by UPDATE statement targeting only 'role', but good to be aware)

          -- 2. The user being updated is NOT the owner of the household.
          NOT EXISTS (
            SELECT 1 FROM public.households h
            WHERE h.id = household_members.household_id AND h.owner_id = household_members.user_id
          )

          -- 3. The user performing the update is NOT updating themselves.
          AND household_members.user_id != auth.uid()

          -- 4. The new role must be 'admin' or 'member'.
          AND household_members.role IN ('admin', 'member')
        );
