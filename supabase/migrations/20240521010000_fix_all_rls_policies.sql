-- Drop existing problematic policies
DROP POLICY IF EXISTS "Superusers can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can update all profiles" ON user_profiles;

-- Create new policies that don't have circular dependencies
CREATE POLICY "Superusers can view all profiles"
    ON user_profiles
    FOR SELECT
    USING (
        (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'superuser'
    );

CREATE POLICY "Superusers can update all profiles"
    ON user_profiles
    FOR UPDATE
    USING (
        (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'superuser'
    );

-- Drop and recreate the insert policy with better permissions
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = id
        OR
        -- Allow service role to create profiles
        (SELECT current_setting('role') = 'service_role')
    );

-- Ensure authenticated role has proper permissions
GRANT INSERT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;

-- Explicitly grant service role permissions again
GRANT ALL ON user_profiles TO service_role;
