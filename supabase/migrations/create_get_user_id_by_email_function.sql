```sql
/*
  # Create get_user_id_by_email Function

  This migration adds a PostgreSQL function to securely retrieve a user's ID based on their email address. This is necessary because directly querying the `auth.users` table from the client-side is typically restricted by Row Level Security (RLS) for security reasons (preventing enumeration of user emails).

  1. New Function
     - `get_user_id_by_email(user_email text)`
       - **Input**: `user_email` (text) - The email address to look up.
       - **Output**: `uuid` - The corresponding user ID from `auth.users`, or NULL if not found.
       - **Security**: Defined with `SECURITY DEFINER` and `search_path = public`. This allows the function to bypass the calling user's RLS temporarily *only* for the duration of the function's execution, specifically to query `auth.users`. It runs with the privileges of the user who defines the function (usually the database owner or a privileged role).
       - **Permissions**: Grants `EXECUTE` permission to the `authenticated` role, allowing logged-in users to call this function.

  2. Security Considerations
     - **SECURITY DEFINER**: This is powerful and should be used cautiously. The function logic must be carefully written to avoid security vulnerabilities (e.g., SQL injection, although less likely with simple selects). In this case, it's used for a specific, limited purpose: looking up a user ID by email.
     - **Permissions**: Only authenticated users can execute this function. Anonymous users cannot use it to probe for emails.
     - **Error Handling**: The function returns NULL if the email is not found, preventing information leakage about which emails exist or don't exist beyond a simple "found" or "not found" result.

  3. Notes
     - This function provides a controlled way for the frontend (or other services) to resolve an email to a user ID without granting broad access to the `auth.users` table.
     - It's essential for features like adding household members by email where the client needs the target user's ID but shouldn't be able to browse all users.
*/

-- Drop the function if it exists to ensure a clean setup
DROP FUNCTION IF EXISTS public.get_user_id_by_email(text);

-- Create the function
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER -- Allows bypassing RLS for the query inside the function
SET search_path = public -- Explicitly set search path
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(user_email); -- Case-insensitive comparison
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;

COMMENT ON FUNCTION public.get_user_id_by_email(text) IS 'Retrieves the user ID for a given email address (case-insensitive). SECURITY DEFINER allows lookup in auth.users.';
    ```