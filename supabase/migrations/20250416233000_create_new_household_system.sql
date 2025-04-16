-- Migration: Create new household budgeting system
-- 1. Households table
CREATE TABLE IF NOT EXISTS public.households (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Household Members table
CREATE TABLE IF NOT EXISTS public.household_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    invited_email text,
    status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
    joined_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(household_id, user_id)
);

-- 3. Household Invitations table
CREATE TABLE IF NOT EXISTS public.household_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    email text NOT NULL,
    invite_token text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Update Expenses table (add household_id, type)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'household'));

-- 5. RLS Policies
-- Enable RLS
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- Households: Only owners/admins can manage
DROP POLICY IF EXISTS "Owner can manage household" ON public.households;
CREATE POLICY "Owner can manage household" ON public.households
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_members.household_id = id
        AND household_members.user_id = auth.uid()
        AND household_members.role IN ('owner', 'admin')
    ));

-- Household Members: Only owner/admin can add/remove, members can view themselves
DROP POLICY IF EXISTS "View own household membership" ON public.household_members;
CREATE POLICY "View own household membership" ON public.household_members
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Owner/admin manage members" ON public.household_members;
CREATE POLICY "Owner/admin manage members" ON public.household_members
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.household_members m
        WHERE m.household_id = household_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    ));

-- Invitations: Only owner/admin can invite
DROP POLICY IF EXISTS "Owner/admin manage invites" ON public.household_invitations;
CREATE POLICY "Owner/admin manage invites" ON public.household_invitations
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.household_members m
        WHERE m.household_id = household_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    ));
