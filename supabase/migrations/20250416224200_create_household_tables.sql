/*
      # Create Household Tables (DEBUGGING - Simplified Member Insert Policy)

      This migration creates the necessary tables for managing households and their members.
      WARNING: The policy for adding members ('household_members' INSERT) has been simplified
      to WITH CHECK (true) for debugging recursion during household creation.
      This is NOT production-safe.

      1.  **New Tables**
          *   `households`: Stores information about each household group.
          *   `household_members`: Links users to households and defines their role.

      2.  **Security**
          *   Enable RLS on both tables.
          *   Policies for `households`:
              *   Owners can insert, update, delete their own households.
              *   Members can select households they belong to.
          *   Policies for `household_members`:
              *   Users can select their own membership records.
              *   Household owners can select all members of their households.
              *   Household owners can insert new members into their households (DEBUG: Simplified WITH CHECK).
              *   Users can delete their own membership record (leave household), unless they are the owner.
              *   Household owners can delete members from their households (except themselves).

      3.  **Indexes**
          *   Index on `households.owner_id`.
          *   Index on `household_members.user_id`.
    */

    -- Create households table
    CREATE TABLE IF NOT EXISTS public.households (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
        owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL
    );

    -- Create household_members table (join table)
    CREATE TABLE IF NOT EXISTS public.household_members (
        household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
        joined_at timestamptz DEFAULT now() NOT NULL,
        PRIMARY KEY (household_id, user_id) -- Composite primary key
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_households_owner_id ON public.households(owner_id);
    CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);

    -- Enable RLS
    ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

    -- RLS Policies for households table (Keep from previous attempt)
    DROP POLICY IF EXISTS "Owners can manage their households" ON public.households;
    DROP POLICY IF EXISTS "Members can view households they belong to" ON public.households;
    DROP POLICY IF EXISTS "Owners can SELECT their households" ON public.households;
    DROP POLICY IF EXISTS "Owners can INSERT their households" ON public.households;
    DROP POLICY IF EXISTS "Owners can UPDATE their households" ON public.households;
    DROP POLICY IF EXISTS "Owners can DELETE their households" ON public.households;
    DROP POLICY IF EXISTS "Members OR Owners can view households" ON public.households;

    DROP POLICY IF EXISTS "Owners can INSERT their households" ON public.households;
CREATE POLICY "Owners can INSERT their households"
        ON public.households FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
    DROP POLICY IF EXISTS "Owners can UPDATE their households" ON public.households;
CREATE POLICY "Owners can UPDATE their households"
        ON public.households FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
    DROP POLICY IF EXISTS "Owners can DELETE their households" ON public.households;
CREATE POLICY "Owners can DELETE their households"
        ON public.households FOR DELETE TO authenticated USING (auth.uid() = owner_id);
    DROP POLICY IF EXISTS "Members can view households they belong to" ON public.households;
CREATE POLICY "Members can view households they belong to"
        ON public.households FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.household_members hm WHERE hm.household_id = households.id AND hm.user_id = auth.uid()));

    -- RLS Policies for household_members table
    DROP POLICY IF EXISTS "Users can view their own membership" ON public.household_members;
    DROP POLICY IF EXISTS "Users can view their own membership" ON public.household_members;
CREATE POLICY "Users can view their own membership"
        ON public.household_members FOR SELECT TO authenticated USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Owners can view members of their households" ON public.household_members;
    DROP POLICY IF EXISTS "Owners can view members of their households" ON public.household_members;
CREATE POLICY "Owners can view members of their households"
        ON public.household_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()));

    -- DEBUG: Simplify the INSERT policy check for household_members
    DROP POLICY IF EXISTS "Owners can add members to their households" ON public.household_members;
    DROP POLICY IF EXISTS "Owners can add members to their households" ON public.household_members;
CREATE POLICY "Owners can add members to their households"
        ON public.household_members
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.households h
            WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()
          )
        );

    DROP POLICY IF EXISTS "Members can leave households (delete own membership)" ON public.household_members;
    DROP POLICY IF EXISTS "Members can leave households (delete own membership)" ON public.household_members;
CREATE POLICY "Members can leave households (delete own membership)"
        ON public.household_members FOR DELETE TO authenticated USING (auth.uid() = user_id AND role <> 'owner');

    DROP POLICY IF EXISTS "Owners can remove members from their households" ON public.household_members;
    DROP POLICY IF EXISTS "Owners can remove members from their households" ON public.household_members;
CREATE POLICY "Owners can remove members from their households"
        ON public.household_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()) AND household_members.user_id <> auth.uid());

    -- Function to automatically update 'updated_at' timestamp
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger for households table
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_household_update_set_timestamp') THEN
        CREATE TRIGGER on_household_update_set_timestamp
        BEFORE UPDATE ON public.households
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
      END IF;
    END $$;