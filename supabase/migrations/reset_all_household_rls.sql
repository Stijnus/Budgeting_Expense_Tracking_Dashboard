/*
        # Reset All Household-Related RLS Policies

        This migration explicitly drops all known RLS policies for `households` and `household_members` tables and then recreates the intended set to ensure a clean state and resolve potential conflicts or recursion issues.

        **Target State:**
        - `households`:
            - INSERT: Owner only
            - SELECT: Owner only (Simplified for debugging)
            - UPDATE: Owner only
            - DELETE: Owner only
        - `household_members`:
            - INSERT: Owner or Admin
            - SELECT: Self or Owner
            - UPDATE: Owner or Admin (for roles 'admin'/'member', not self, not owner)
            - DELETE: Self, Owner, or Admin (not owner)

        1. **Policy Drops**:
           - Explicitly drops all previously defined policies by name for both tables.

        2. **Policy Creations**:
           - Recreates the policies listed above with their specific logic.

        3. **Security**:
           - Re-establishes the intended security rules from a clean slate.
           - Uses the simplified `households` SELECT policy to aid debugging.
      */

      -- Ensure RLS is enabled (redundant but safe)
      ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

      -- == Drop ALL policies on households ==
      DROP POLICY IF EXISTS "Users can insert households for themselves" ON public.households;
      DROP POLICY IF EXISTS "Allow household insert for owner" ON public.households;
      DROP POLICY IF EXISTS "Users can view own households" ON public.households;
      DROP POLICY IF EXISTS "Users can view households they are members of" ON public.households;
      DROP POLICY IF EXISTS "Household members can view their household" ON public.households;
      DROP POLICY IF EXISTS "Allow household select for owner or member" ON public.households;
      DROP POLICY IF EXISTS "Allow household select for owner ONLY" ON public.households; -- Simplified version
      DROP POLICY IF EXISTS "Owners can update their households" ON public.households;
      DROP POLICY IF EXISTS "Allow household update for owner" ON public.households;
      DROP POLICY IF EXISTS "Owners can delete their households" ON public.households;
      DROP POLICY IF EXISTS "Allow household delete for owner" ON public.households;

      -- == Drop ALL policies on household_members ==
      DROP POLICY IF EXISTS "Allow member select for self or owner" ON public.household_members;
      DROP POLICY IF EXISTS "Allow owner to insert members" ON public.household_members;
      DROP POLICY IF EXISTS "Allow owner or admin to insert members" ON public.household_members;
      DROP POLICY IF EXISTS "Allow member delete for self or owner" ON public.household_members;
      DROP POLICY IF EXISTS "Allow member delete for self, owner, or admin" ON public.household_members;
      DROP POLICY IF EXISTS "Allow owner or admin to update member roles" ON public.household_members;


      -- == Recreate policies for households ==

      -- INSERT Policy (Owner Only)
      CREATE POLICY "Allow household insert for owner"
        ON public.households FOR INSERT TO authenticated
        WITH CHECK ( owner_id = auth.uid() );

      -- SELECT Policy (Owner Only - SIMPLIFIED)
      CREATE POLICY "Allow household select for owner ONLY"
        ON public.households FOR SELECT TO authenticated
        USING ( owner_id = auth.uid() );

      -- UPDATE Policy (Owner Only)
      CREATE POLICY "Allow household update for owner"
        ON public.households FOR UPDATE TO authenticated
        USING ( owner_id = auth.uid() )
        WITH CHECK ( owner_id = auth.uid() );

      -- DELETE Policy (Owner Only)
      CREATE POLICY "Allow household delete for owner"
        ON public.households FOR DELETE TO authenticated
        USING ( owner_id = auth.uid() );


      -- == Recreate policies for household_members ==

      -- SELECT Policy (Self or Owner of Household)
      CREATE POLICY "Allow member select for self or owner"
        ON public.household_members FOR SELECT TO authenticated
        USING ( (user_id = auth.uid()) OR EXISTS ( SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = auth.uid() ) );

      -- INSERT Policy (Owner or Admin of Household)
      CREATE POLICY "Allow owner or admin to insert members"
        ON public.household_members FOR INSERT TO authenticated
        WITH CHECK ( EXISTS ( SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = auth.uid() ) OR EXISTS ( SELECT 1 FROM public.household_members m WHERE m.household_id = household_members.household_id AND m.user_id = auth.uid() AND m.role = 'admin' ) );

      -- DELETE Policy (Self, or Owner/Admin deleting others except Owner)
      CREATE POLICY "Allow member delete for self, owner, or admin"
        ON public.household_members FOR DELETE TO authenticated
        USING ( (user_id = auth.uid()) OR ( NOT EXISTS ( SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = household_members.user_id ) AND ( EXISTS ( SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = auth.uid() ) OR EXISTS ( SELECT 1 FROM public.household_members m WHERE m.household_id = household_members.household_id AND m.user_id = auth.uid() AND m.role = 'admin' ) ) ) );

      -- UPDATE Policy (Owner or Admin updating roles of others except Owner)
      CREATE POLICY "Allow owner or admin to update member roles"
        ON public.household_members FOR UPDATE TO authenticated
        USING ( EXISTS ( SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = auth.uid() ) OR EXISTS ( SELECT 1 FROM public.household_members m WHERE m.household_id = household_members.household_id AND m.user_id = auth.uid() AND m.role = 'admin' ) )
        WITH CHECK ( NOT EXISTS ( SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = household_members.user_id ) AND household_members.user_id != auth.uid() AND household_members.role IN ('admin', 'member') );
