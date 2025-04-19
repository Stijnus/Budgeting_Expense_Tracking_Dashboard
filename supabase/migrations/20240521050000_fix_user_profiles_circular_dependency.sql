-- Drop the problematic policies
DROP POLICY IF EXISTS "Superusers can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superusers can update all profiles" ON user_profiles;

-- Create a function to check if a user is a superuser without causing circular dependencies
CREATE OR REPLACE FUNCTION is_superuser(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Direct query to avoid RLS circular dependency
    SELECT role::TEXT INTO user_role 
    FROM user_profiles 
    WHERE id = user_id;
    
    RETURN user_role = 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies using the function
CREATE POLICY "Superusers can view all profiles"
    ON user_profiles
    FOR SELECT
    USING (
        is_superuser(auth.uid())
    );

CREATE POLICY "Superusers can update all profiles"
    ON user_profiles
    FOR UPDATE
    USING (
        is_superuser(auth.uid())
    );

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_superuser TO authenticated;
GRANT EXECUTE ON FUNCTION is_superuser TO anon;

-- Ensure service role has all necessary permissions
GRANT ALL ON user_profiles TO service_role;
