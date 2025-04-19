-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (id, email, first_name, last_name)
    VALUES (NEW.id, NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
    );

    -- Create default settings
    INSERT INTO public.user_settings (user_id, default_currency)
    VALUES (NEW.id, 'EUR');

    -- Create default categories
    INSERT INTO public.categories (user_id, name, color)
    VALUES
        (NEW.id, 'Housing', '#FF5733'),
        (NEW.id, 'Transportation', '#33FF57'),
        (NEW.id, 'Food', '#3357FF'),
        (NEW.id, 'Utilities', '#FF33F5'),
        (NEW.id, 'Entertainment', '#33FFF5'),
        (NEW.id, 'Healthcare', '#F5FF33'),
        (NEW.id, 'Shopping', '#FF3333'),
        (NEW.id, 'Other', '#808080');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Down migration
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
