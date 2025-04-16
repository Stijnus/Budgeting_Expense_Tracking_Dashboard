/*
      # Create get_user_id_by_email Function

      This migration creates a PostgreSQL function to securely retrieve a user's ID based on their email address. This is useful for adding household members without exposing user IDs directly in the client.

      1.  **New Function**
          *   `get_user_id_by_email(user_email text)`:
              *   Accepts an email address (text).
              *   Returns the corresponding user's ID (uuid) from `auth.users`.
              *   Returns `NULL` if the email is not found.
              *   Defined with `SECURITY DEFINER` to run with the permissions of the function owner (typically `postgres`), allowing it to query `auth.users`.
              *   Grants `EXECUTE` permission to the `authenticated` role, allowing logged-in users to call it.

      2.  **Security**
          *   Uses `SECURITY DEFINER` for necessary permissions to query `auth.users`.
          *   Restricted execution to `authenticated` users.
    */

    -- Drop function if it exists to ensure clean creation/update
    DROP FUNCTION IF EXISTS public.get_user_id_by_email(text);

    -- Create the function
    CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
    RETURNS uuid
    LANGUAGE sql
    SECURITY DEFINER -- Important: Allows the function to query auth.users
    -- Set a secure search path: IMPORTANT to prevent search path hijacking
    SET search_path = public
    AS $$
      SELECT id
      FROM auth.users
      WHERE email = user_email;
    $$;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;