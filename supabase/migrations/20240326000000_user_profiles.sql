-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superuser');

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Superusers can view all profiles
CREATE POLICY "Superusers can view all profiles"
    ON user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'superuser'
        )
    );

-- Superusers can update all profiles
CREATE POLICY "Superusers can update all profiles"
    ON user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'superuser'
        )
    );

-- Create the first superuser (this should be replaced with the actual email of the superuser)
-- Note: This needs to be executed after the first superuser signs up
-- INSERT INTO user_profiles (id, email, first_name, last_name, role)
-- SELECT id, email, 'Super', 'User', 'superuser'
-- FROM auth.users
-- WHERE email = 'your-superuser@email.com'
-- LIMIT 1;

-- Create indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Down migration
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TYPE IF EXISTS user_role CASCADE;
-- DROP FUNCTION IF EXISTS handle_updated_at CASCADE; 