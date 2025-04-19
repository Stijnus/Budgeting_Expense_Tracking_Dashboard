-- Create a function to get the server time
-- This is used for connection health checks
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
AS $$
    SELECT NOW();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_server_time() TO authenticated;
GRANT EXECUTE ON FUNCTION get_server_time() TO anon;
