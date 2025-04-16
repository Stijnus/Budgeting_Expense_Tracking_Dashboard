/*
  # Create Categories Table

  This migration creates the `categories` table to store user-defined spending categories.

  1.  **New Tables**
      *   `categories`
          *   `id` (uuid, primary key): Unique identifier for the category.
          *   `user_id` (uuid, foreign key): Links to the authenticated user who owns the category.
          *   `name` (text): The name of the category (e.g., "Groceries", "Transport").
          *   `created_at` (timestamptz): Timestamp of when the category was created.

  2.  **Indexes**
      *   Index on `user_id` for efficient querying of user-specific categories.

  3.  **Security**
      *   Enable Row Level Security (RLS) on the `categories` table.
      *   Policy: Authenticated users can perform CRUD operations on their *own* categories.
      *   Policy: Deny all access to unauthenticated users.
*/

-- 1. Create Table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_category_name UNIQUE (user_id, name) -- Ensure category names are unique per user
);

-- 2. Add Indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- 3. Enable RLS and Add Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users full control over their own categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional: Explicitly deny access to unauthenticated users (good practice)
-- Supabase defaults might handle this, but explicit is clearer.
-- CREATE POLICY "Deny access to unauthenticated users"
--   ON categories
--   FOR ALL
--   TO public
--   USING (false); -- Always false for public access

COMMENT ON TABLE categories IS 'Stores user-defined spending categories.';
COMMENT ON COLUMN categories.user_id IS 'The user who owns this category.';
COMMENT ON COLUMN categories.name IS 'Name of the spending category.';
