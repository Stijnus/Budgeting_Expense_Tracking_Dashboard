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

-- Ensure service role has all necessary permissions
GRANT ALL ON user_profiles TO service_role;

-- Down migration
-- DROP POLICY IF EXISTS "Superusers can view all profiles" ON user_profiles;
-- DROP POLICY IF EXISTS "Superusers can update all profiles" ON user_profiles; 