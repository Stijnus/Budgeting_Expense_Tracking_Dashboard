import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "../src/lib/database.types";

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create a Supabase client with the service role key
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
);
