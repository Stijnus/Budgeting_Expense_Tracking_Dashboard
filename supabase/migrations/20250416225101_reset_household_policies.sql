-- Drop all existing policies for households and household_members
DROP POLICY IF EXISTS "Owners can manage their households" ON public.households;
DROP POLICY IF EXISTS "Owners can SELECT their households" ON public.households;
DROP POLICY IF EXISTS "Owners can INSERT their households" ON public.households;
DROP POLICY IF EXISTS "Owners can UPDATE their households" ON public.households;
DROP POLICY IF EXISTS "Owners can DELETE their households" ON public.households;
DROP POLICY IF EXISTS "Members OR Owners can view households" ON public.households;
DROP POLICY IF EXISTS "Members can view households they belong to" ON public.households;

DROP POLICY IF EXISTS "Users can view their own membership" ON public.household_members;
DROP POLICY IF EXISTS "Owners can view members of their households" ON public.household_members;
DROP POLICY IF EXISTS "Owners can add members to their households" ON public.household_members;
DROP POLICY IF EXISTS "Members can leave households (delete own membership)" ON public.household_members;
DROP POLICY IF EXISTS "Owners can remove members from their households" ON public.household_members;

-- Only allow owners to insert their own households
CREATE POLICY "Owners can INSERT their households"
    ON public.households FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- Only allow owners to update their own households
CREATE POLICY "Owners can UPDATE their households"
    ON public.households FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Only allow owners to delete their own households
CREATE POLICY "Owners can DELETE their households"
    ON public.households FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);

-- Only allow members to view households they belong to (no recursion)
CREATE POLICY "Members can view households they belong to"
    ON public.households FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.household_members hm
        WHERE hm.household_id = households.id AND hm.user_id = auth.uid()
      )
    );

-- For household_members table:
-- Only allow users to view their own membership
CREATE POLICY "Users can view their own membership"
    ON public.household_members FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Only allow owners to view members of their households
CREATE POLICY "Owners can view members of their households"
    ON public.household_members FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.households h
        WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
      )
    );

-- Only allow owners to add members to their households
CREATE POLICY "Owners can add members to their households"
    ON public.household_members FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.households h
        WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
      )
    );

-- Members can leave (delete own membership) if not owner
CREATE POLICY "Members can leave households (delete own membership)"
    ON public.household_members FOR DELETE TO authenticated
    USING (auth.uid() = user_id AND role <> 'owner');

-- Owners can remove members from their households
CREATE POLICY "Owners can remove members from their households"
    ON public.household_members FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.households h
        WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
      )
      AND household_members.user_id <> auth.uid()
    );
