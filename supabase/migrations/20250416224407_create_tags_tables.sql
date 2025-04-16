/*
  # Create Tags and Expense_Tags Tables

  This migration adds tables to support tagging expenses.

  1. New Tables
     - `tags`
       - `id` (uuid, primary key): Unique identifier for the tag.
       - `user_id` (uuid, foreign key -> auth.users): Links the tag to the user who created it.
       - `name` (text): The name of the tag (e.g., "work", "travel", "project-x").
       - `created_at` (timestamptz): Timestamp of creation.
     - `expense_tags`
       - `expense_id` (uuid, foreign key -> expenses): Links to the expense being tagged.
       - `tag_id` (uuid, foreign key -> tags): Links to the tag being applied.

  2. Indexes
     - `tags`: Index on `user_id` and `name` for lookups and enforcing uniqueness.
     - `expense_tags`: Indexes on `expense_id` and `tag_id` for efficient joining.

  3. Constraints
     - `tags`: Unique constraint on (`user_id`, `name`) to prevent duplicate tags per user (case-sensitive).
     - `expense_tags`: Primary key on (`expense_id`, `tag_id`) prevents applying the same tag multiple times to one expense. Foreign keys ensure data integrity, deleting links if the expense or tag is deleted.

  4. Security
     - Enable Row Level Security (RLS) on both tables.
     - `tags` policies:
       - Users can manage (SELECT, INSERT, UPDATE, DELETE) their own tags.
     - `expense_tags` policies:
       - Users can SELECT links if they own the associated expense.
       - Users can INSERT links if they own both the expense and the tag.
       - Users can DELETE links if they own the associated expense.
       - UPDATE is generally not needed for a simple join table like this.

  5. Notes
     - Tag names are case-sensitive by default with the unique constraint. Consider using `lower(name)` in the constraint if case-insensitivity is desired.
*/

-- 1. Create the tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(trim(name)) > 0), -- Ensure name is not empty or just whitespace
    created_at timestamptz DEFAULT now() NOT NULL,

    CONSTRAINT tags_user_id_name_key UNIQUE (user_id, name) -- Unique tag name per user
);

-- Add comments
COMMENT ON TABLE public.tags IS 'Stores user-defined tags for categorizing expenses.';
COMMENT ON COLUMN public.tags.name IS 'The name of the tag.';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id_name ON public.tags(user_id, name); -- For unique constraint and lookups

-- Enable RLS for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
CREATE POLICY "Users can manage their own tags"
ON public.tags
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 2. Create the expense_tags join table
CREATE TABLE IF NOT EXISTS public.expense_tags (
    expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,

    PRIMARY KEY (expense_id, tag_id) -- Composite primary key
);

-- Add comments
COMMENT ON TABLE public.expense_tags IS 'Links expenses to tags (many-to-many relationship).';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense_id ON public.expense_tags(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_tag_id ON public.expense_tags(tag_id);

-- Enable RLS for expense_tags
ALTER TABLE public.expense_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_tags

-- Allow users to see links for expenses they own
DROP POLICY IF EXISTS "Users can view tags for their expenses" ON public.expense_tags;
DROP POLICY IF EXISTS "Users can view tags for their expenses" ON public.tags;
CREATE POLICY "Users can view tags for their expenses"
ON public.expense_tags
FOR SELECT
TO authenticated
USING (
    expense_id IN (SELECT id FROM public.expenses WHERE user_id = auth.uid())
);

-- Allow users to link tags they own to expenses they own
DROP POLICY IF EXISTS "Users can link their own tags to their own expenses" ON public.expense_tags;
DROP POLICY IF EXISTS "Users can link their own tags to their own expenses" ON public.expense_tags;
CREATE POLICY "Users can link their own tags to their own expenses"
ON public.expense_tags
FOR INSERT
TO authenticated
WITH CHECK (
    expense_id IN (SELECT id FROM public.expenses WHERE user_id = auth.uid())
    AND
    tag_id IN (SELECT id FROM public.tags WHERE user_id = auth.uid())
);

-- Allow users to delete links for expenses they own
DROP POLICY IF EXISTS "Users can delete tag links from their expenses" ON public.expense_tags;
DROP POLICY IF EXISTS "Users can delete tag links from their expenses" ON public.expense_tags;
CREATE POLICY "Users can delete tag links from their expenses"
ON public.expense_tags
FOR DELETE
TO authenticated
USING (
    expense_id IN (SELECT id FROM public.expenses WHERE user_id = auth.uid())
);
