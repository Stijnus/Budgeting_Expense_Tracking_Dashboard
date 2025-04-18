import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in .env");
}

// The createClient function is now correctly typed with your database schema
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the Database type itself if needed elsewhere
export type { Database } from "../types/supabase";
