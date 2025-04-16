```sql
/*
      # Create Household Tables

      This migration introduces the foundational tables for the Household Budgeting feature.

      1.  New Tables
          *   `households`
              *   `id` (uuid, primary key): Unique identifier for the household.
              *   `name` (text, not null): Name of the household (e.g., "Smith Family", "Shared Apartment").
              *   `owner_id` (uuid, foreign key -> auth.users): The user who created and owns the household. Ownership transfer is not handled in this basic setup.
              *   `created_at` (timestamptz): Timestamp of creation.
              *   `updated_at` (timestamptz): Timestamp of last update (trigger handled).
          *   `household_members`
              *   `household_id` (uuid, foreign key -> households): Links to the household. Cascades delete if household is deleted.
              *   `user_id` (uuid, foreign key -> auth.users): Links to the user who is a member. Cascades delete if user is deleted.
              *   `role` (text, not null, default 'member'): Role within the household (e.g., 'owner', 'member'). Simple roles for now.
              *   `joined_at` (timestamptz): Timestamp when the user joined the household.
              *   Primary Key: (`household_id`, `user_id`) ensures a user is only in a household once.

      2.  Indexes
          *   `households`: Index on `owner_id`.
          *   `household_members`: Indexes on `household_id` and `user_id`.

      3.  Triggers
          *   `handle_updated_at` trigger applied to `households` table.

      4.  Security (RLS)
          *   RLS enabled on both `households` and `household_members`.
          *   `households` Policies:
              *   Members can SELECT households they belong to.
              *   Owners can UPDATE their household's name.
              *   Owners can DELETE their household (cascades to members and potentially linked items later).
              *   Authenticated users can INSERT (create) new households (they become the owner).
          *   `household_members` Policies:
              *   Members can SELECT their own membership record.
              *   Owners can SELECT all members of households they own.
              *   Owners can INSERT new members into households they own.
              *   Owners can DELETE members (except themselves) from households they own.
              *   Members can DELETE their own membership record (leave household), *unless* they are the owner.

      5.  Constraints
          *   Foreign keys link `households` to `auth.users` (owner) and `household_members` to `households` and `auth.users`.
          *   Check constraint ensures `households.name` is not empty.
          *   Check constraint ensures `household_members.role` is either 'owner' or 'member'.
          *   Primary key on `household_members` prevents duplicate memberships.

      6.  Notes
          *   This migration only sets up the core household structure. Linking existing data (expenses, incomes, etc.) will be done in a separate migration.
          *   Advanced features like invitations, role management beyond owner/member, and ownership transfer are not included initially.
    */

    -- Ensure the moddatetime extension is enabled (should be from previous migrations)
    CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

    -- ==== Households Table ====

    CREATE TABLE IF NOT EXISTS public.households (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL CHECK (char_length(trim(name)) > 0),
        owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT, -- Prevent deleting user if they own a household? Or handle transfer? RESTRICT for now.
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL
    );

    COMMENT ON TABLE public.households IS 'Stores information about shared households.';
    COMMENT ON COLUMN public.households.name IS 'The user-defined name of the household.';
    COMMENT ON COLUMN public.households.owner_id IS 'The user who owns and manages the household.';

    -- Indexes for households
    CREATE INDEX IF NOT EXISTS idx_households_owner_id ON public.households(owner_id);

    -- Trigger for updated_at on households
    DROP TRIGGER IF EXISTS handle_updated_at ON public.households;
    CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime (updated_at);

    -- RLS for households
    ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

    -- Policy: Members can see households they belong to.
    DROP POLICY IF EXISTS "Members can view their households" ON public.households;
    CREATE POLICY "Members can view their households"
    ON public.households
    FOR SELECT
    TO authenticated
    USING (
      id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    );

    -- Policy: Owners can update their household's name.
    DROP POLICY IF EXISTS "Owners can update their households" ON public.households;
    CREATE POLICY "Owners can update their households"
    ON public.households
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id); -- Can only update their own

    -- Policy: Owners can delete their households.
    DROP POLICY IF EXISTS "Owners can delete their households" ON public.households;
    CREATE POLICY "Owners can delete their households"
    ON public.households
    FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

    -- Policy: Authenticated users can create households.
    DROP POLICY IF EXISTS "Users can create households" ON public.households;
    CREATE POLICY "Users can create households"
    ON public.households
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id); -- The creator becomes the owner


    -- ==== Household Members Table ====

    CREATE TABLE IF NOT EXISTS public.household_members (
        household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
        joined_at timestamptz DEFAULT now() NOT NULL,
        PRIMARY KEY (household_id, user_id) -- Composite primary key
    );

    COMMENT ON TABLE public.household_members IS 'Links users to households and defines their role.';
    COMMENT ON COLUMN public.household_members.role IS 'Role of the user within the household (owner, member).';
    COMMENT ON COLUMN public.household_members.joined_at IS 'Timestamp when the user joined the household.';

    -- Indexes for household_members
    CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);
    CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);

    -- RLS for household_members
    ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

    -- Policy: Members can view their own membership record.
    DROP POLICY IF EXISTS "Members can view their own membership" ON public.household_members;
    CREATE POLICY "Members can view their own membership"
    ON public.household_members
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

    -- Policy: Owners can view all members of their household.
    DROP POLICY IF EXISTS "Owners can view members of their household" ON public.household_members;
    CREATE POLICY "Owners can view members of their household"
    ON public.household_members
    FOR SELECT
    TO authenticated
    USING (
      household_id IN (SELECT id FROM public.households WHERE owner_id = auth.uid())
    );

    -- Policy: Owners can add members to their household.
    -- Note: This allows direct adding. Invitation system would be more complex.
    -- Note: We also need to ensure the owner adds themselves with the 'owner' role when creating the household. This should be handled application-side.
    DROP POLICY IF EXISTS "Owners can add members to their household" ON public.household_members;
    CREATE POLICY "Owners can add members to their household"
    ON public.household_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
      household_id IN (SELECT id FROM public.households WHERE owner_id = auth.uid())
      AND role IN ('owner', 'member') -- Allow setting role on insert
    );

    -- Policy: Owners can remove members (but not themselves) from their household.
    DROP POLICY IF EXISTS "Owners can remove members from their household" ON public.household_members;
    CREATE POLICY "Owners can remove members from their household"
    ON public.household_members
    FOR DELETE
    TO authenticated
    USING (
      household_id IN (SELECT id FROM public.households WHERE owner_id = auth.uid())
      AND auth.uid() != user_id -- Owner cannot remove themselves via this policy
    );

    -- Policy: Members can remove themselves (leave household), but only if they are not the owner.
    DROP POLICY IF EXISTS "Members can leave households" ON public.household_members;
    CREATE POLICY "Members can leave households"
    ON public.household_members
    FOR DELETE
    TO authenticated
    USING (
      auth.uid() = user_id
      AND role != 'owner' -- Prevent owner from leaving via this policy
    );

    -- Policy: Owners can update member roles (but cannot change owner role easily here).
    -- Keep it simple: For now, disallow role updates via RLS. Handle in application logic if needed.
    -- DROP POLICY IF EXISTS "Owners can update member roles" ON public.household_members;
    -- CREATE POLICY "Owners can update member roles"
    -- ON public.household_members
    -- FOR UPDATE
    -- TO authenticated
    -- USING (
    --   household_id IN (SELECT id FROM public.households WHERE owner_id = auth.uid())
    -- )
    -- WITH CHECK (
    --   household_id IN (SELECT id FROM public.households WHERE owner_id = auth.uid())
    --   AND role IN ('member') -- Allow changing *to* member, prevent changing *to* owner easily? Complex.
    -- );
    ```