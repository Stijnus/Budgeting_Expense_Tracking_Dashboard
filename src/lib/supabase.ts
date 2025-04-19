import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is not defined in environment variables");
}

if (!supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_ANON_KEY is not defined in environment variables"
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Create a service role client for admin operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey || ""
);

// Helper function to get the current user
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  try {
    console.log("getUserProfile: Fetching profile for user:", userId);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(
        "getUserProfile: Error fetching with regular client:",
        error
      );
      // If the regular client fails, try with admin client
      console.log("getUserProfile: Attempting with admin client...");
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (adminError) {
        console.error("getUserProfile: Admin client error:", adminError);
        throw adminError;
      }

      console.log(
        "getUserProfile: Successfully fetched profile with admin client"
      );
      return adminData;
    }

    console.log(
      "getUserProfile: Successfully fetched profile with regular client"
    );
    return data;
  } catch (error) {
    console.error("getUserProfile: Unexpected error:", error);
    throw error;
  }
};
