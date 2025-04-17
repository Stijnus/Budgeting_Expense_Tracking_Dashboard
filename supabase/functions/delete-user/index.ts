import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("delete-user function initializing.");

// Define a type for the expected user context from the JWT
interface UserContext {
  user: {
    id: string;
    aud: string;
    role: string;
    email?: string; // Optional email
    // Add other relevant fields from your JWT if needed
  };
}

async function deleteUserAccount(supabaseAdmin: SupabaseClient, userId: string) {
  console.log(`Attempting to delete user: ${userId}`);
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error(`Error deleting user ${userId}:`, error);
    // Handle specific errors if needed, e.g., user not found
    if (error.message.includes('User not found')) {
        throw new Error(`User with ID ${userId} not found. Already deleted?`);
    }
    throw new Error(`Failed to delete user: ${error.message}`);
  }

  console.log(`Successfully deleted user ${userId}. Associated data should cascade delete.`);
  return data;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Handling POST request");
    // 1. Create Supabase Admin client
    // Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Edge Function settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
        throw new Error("Server configuration error: Missing Supabase credentials.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log("Supabase admin client created.");

    // 2. Get user ID from JWT
    // Supabase automatically verifies JWT and passes user info in the Authorization header
    // The specific structure might depend slightly on setup, adjust if needed
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        console.error("Missing Authorization header.");
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }

    // Normally, Supabase Edge Functions context provides user info directly.
    // Let's simulate getting it from a hypothetical context or decode JWT if needed.
    // **Important**: In a real Supabase function, you might get user ID more directly.
    // This part needs verification based on how Supabase passes JWT data.
    // Assuming a simplified way to get user ID for this example:
    // We'll rely on the client invoking this function *as the authenticated user*.
    // The function itself doesn't need the JWT directly if we trust the invocation context.
    // Let's assume the client sends the user ID in the body for simplicity here,
    // although using the JWT context is more secure in production.
    // **REVISED APPROACH:** Let's assume the function is invoked correctly and Supabase provides the user context.
    // We need to extract the user ID from the auth mechanism Supabase provides to functions.
    // This often involves checking the `context` object or decoding the JWT passed in headers.
    // For now, let's *assume* we can get the user ID securely.
    // **PLACEHOLDER:** In a real scenario, securely get user ID from JWT/Auth context.
    // For this example, we'll *simulate* getting it. A real implementation needs secure retrieval.

    // **SIMPLIFIED/INSECURE Placeholder:** Client *could* send ID in body (NOT RECOMMENDED FOR PROD)
    // const { userId } = await req.json();
    // if (!userId) throw new Error("User ID not provided in request.");

    // **BETTER (Conceptual):** Get user from Supabase Function context/JWT
    // This part is tricky without running in the actual Supabase env.
    // Let's *assume* the user ID is somehow securely available.
    // We'll use a placeholder ID for the logic flow. Replace with actual secure retrieval.
    // const userId = context.user.id; // Ideal scenario - replace with actual context access

    // **WORKAROUND for this environment:** We'll call getUser() from the ADMIN client
    // based on the JWT passed by the *client's* invocation. This is less direct but works.
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '') // Pass the token from the header
    );

    if (getUserError || !user) {
        console.error("Error getting user from token:", getUserError);
        return new Response(JSON.stringify({ error: 'Invalid authorization token or user not found.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }
    const userId = user.id;
    console.log(`Verified user from token: ${userId}`);


    // 3. Call the delete function
    await deleteUserAccount(supabaseAdmin, userId);

    // 4. Return success response
    console.log("Account deletion process successful for user:", userId);
    return new Response(JSON.stringify({ message: 'Account deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in delete-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Use 500 for server errors, 4xx for client errors
    })
  }
})
