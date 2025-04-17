/*
        # Add ON DELETE CASCADE to Foreign Keys

        This migration updates foreign key constraints to include `ON DELETE CASCADE`. This ensures that when a referenced record (like a user in `auth.users` or a household in `households`) is deleted, all dependent records in other tables are automatically deleted as well. This is crucial for features like account deletion.

        1. **Affected Tables & Constraints**:
            - `categories`: `categories_user_id_fkey` (references `auth.users`)
            - `expenses`: `expenses_user_id_fkey` (references `auth.users`), `expenses_household_id_fkey` (references `households`)
            - `budgets`: `budgets_user_id_fkey` (references `auth.users`), `budgets_household_id_fkey` (references `households`)
            - `incomes`: `incomes_user_id_fkey` (references `auth.users`), `incomes_household_id_fkey` (references `households`)
            - `tags`: `tags_user_id_fkey` (references `auth.users`)
            - `expense_tags`: `expense_tags_expense_id_fkey` (references `expenses`), `expense_tags_tag_id_fkey` (references `tags`) - Cascade needed if expense/tag deleted.
            - `households`: `households_owner_id_fkey` (references `auth.users`) - Deleting user deletes their owned households.
            - `household_members`: `household_members_household_id_fkey` (references `households`), `household_members_user_id_fkey` (references `auth.users`) - Deleting household/user removes membership.

        2. **Changes**:
            - For each relevant constraint:
                - `DROP CONSTRAINT IF EXISTS constraint_name;`
                - `ADD CONSTRAINT constraint_name FOREIGN KEY (column_name) REFERENCES referenced_table(referenced_column) ON DELETE CASCADE;`

        3. **Security & Data Integrity**:
            - Simplifies the account deletion process by relying on the database to manage data cleanup.
            - Prevents orphaned records when users or households are deleted.
      */

      -- Function to safely drop and add constraint with cascade
      DO $$
      DECLARE
          constraint_name text;
          table_name text;
          column_name text;
          referenced_table_name text;
          referenced_column_name text;
      BEGIN
          -- Helper function to drop and recreate FK with ON DELETE CASCADE
          CREATE OR REPLACE FUNCTION apply_cascade_delete(
              p_table_name text,
              p_constraint_name text,
              p_column_name text,
              p_referenced_table_name text,
              p_referenced_column_name text
          ) RETURNS void AS $func$
          BEGIN
              -- Drop the existing constraint if it exists
              EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I;', p_table_name, p_constraint_name);
              -- Add the constraint with ON DELETE CASCADE
              EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(%I) ON DELETE CASCADE;',
                             p_table_name, p_constraint_name, p_column_name, p_referenced_table_name, p_referenced_column_name);
              RAISE NOTICE 'Applied ON DELETE CASCADE to %.%', p_table_name, p_constraint_name;
          EXCEPTION WHEN others THEN
              RAISE WARNING 'Could not apply cascade delete to %.%: %', p_table_name, p_constraint_name, SQLERRM;
          END;
          $func$ LANGUAGE plpgsql;

          -- Apply ON DELETE CASCADE where needed

          -- References to auth.users
          PERFORM apply_cascade_delete('categories', 'categories_user_id_fkey', 'user_id', 'auth.users', 'id');
          PERFORM apply_cascade_delete('expenses', 'expenses_user_id_fkey', 'user_id', 'auth.users', 'id');
          PERFORM apply_cascade_delete('budgets', 'budgets_user_id_fkey', 'user_id', 'auth.users', 'id');
          PERFORM apply_cascade_delete('incomes', 'incomes_user_id_fkey', 'user_id', 'auth.users', 'id');
          PERFORM apply_cascade_delete('tags', 'tags_user_id_fkey', 'user_id', 'auth.users', 'id');
          PERFORM apply_cascade_delete('households', 'households_owner_id_fkey', 'owner_id', 'auth.users', 'id');
          PERFORM apply_cascade_delete('household_members', 'household_members_user_id_fkey', 'user_id', 'auth.users', 'id');

          -- References to households
          PERFORM apply_cascade_delete('expenses', 'expenses_household_id_fkey', 'household_id', 'public.households', 'id');
          PERFORM apply_cascade_delete('budgets', 'budgets_household_id_fkey', 'household_id', 'public.households', 'id');
          PERFORM apply_cascade_delete('incomes', 'incomes_household_id_fkey', 'household_id', 'public.households', 'id');
          PERFORM apply_cascade_delete('household_members', 'household_members_household_id_fkey', 'household_id', 'public.households', 'id');

           -- References to expenses (for expense_tags)
          PERFORM apply_cascade_delete('expense_tags', 'expense_tags_expense_id_fkey', 'expense_id', 'public.expenses', 'id');

          -- References to tags (for expense_tags)
          PERFORM apply_cascade_delete('expense_tags', 'expense_tags_tag_id_fkey', 'tag_id', 'public.tags', 'id');

          -- Drop the helper function
          DROP FUNCTION apply_cascade_delete(text, text, text, text, text);

      END $$;
