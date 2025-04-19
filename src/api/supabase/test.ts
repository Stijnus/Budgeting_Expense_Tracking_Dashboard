import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log("Testing connection to Supabase...");
    console.log("URL:", supabaseUrl);

    // Test 1: Check if we can connect to Supabase
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError) {
      console.error("❌ Auth check failed:", authError.message);
      return;
    }

    console.log("✅ Successfully connected to Supabase!");
    console.log(
      "Authentication Status:",
      session
        ? "✅ Authenticated"
        : "➡️ Not authenticated (expected for anon key)"
    );

    // Test 2: List available tables (this will work even with RLS)
    const { error: tablesError } = await supabase
      .from("categories")
      .select("id")
      .limit(1);

    if (tablesError) {
      if (tablesError.code === "PGRST301") {
        console.log(
          "ℹ️ Table access is restricted (this is normal with RLS enabled)"
        );
      } else {
        console.error("❌ Table access test failed:", tablesError.message);
      }
    } else {
      console.log("✅ Successfully queried categories table!");
    }
  } catch (err) {
    console.error("❌ Connection test failed:", err);
  } finally {
    process.exit(0);
  }
}

// Run the test
testConnection();
