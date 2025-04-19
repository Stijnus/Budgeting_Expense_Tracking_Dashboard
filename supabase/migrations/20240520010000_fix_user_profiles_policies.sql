-- Add insert policy for user_profiles
CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Add service role bypass for RLS
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Down migration
-- DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles; 