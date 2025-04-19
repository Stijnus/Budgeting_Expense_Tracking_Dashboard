import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

// Client-side environment variables (available with VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Server-side environment variables (not exposed to client)
// For server-side only operations (Node.js environment)
const supabaseServiceRoleKey =
  // Try to access from import.meta.env with new naming convention
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
  // Fallback to old naming convention with VITE_ prefix for backward compatibility
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  // Fallback to process.env for server environments
  (typeof process !== "undefined"
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : undefined);

// Log for debugging (remove in production)
console.log("Service role key available:", !!supabaseServiceRoleKey);

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
    storageKey: "supabase.auth.token",
    storage: {
      getItem: (key) => {
        try {
          // Try localStorage first
          const localValue = localStorage.getItem(key);
          if (localValue) return localValue;

          // Fall back to sessionStorage
          return sessionStorage.getItem(key);
        } catch (error) {
          console.error("Error accessing storage:", error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error("Error setting item in localStorage:", error);
          try {
            // Fall back to sessionStorage if localStorage fails
            sessionStorage.setItem(key, value);
          } catch (sessionError) {
            console.error(
              "Error setting item in sessionStorage:",
              sessionError
            );
          }
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (error) {
          console.error("Error removing item from storage:", error);
        }
      },
    },
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "budget-tracker",
    },
    // Increase timeout for queries
    fetch: (url, options = {}) => {
      const timeout = 30000; // 30 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      })
        .then((response) => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          throw error;
        });
    },
  },
});

// Create a service role client for admin operations
// This should only be used in server-side code, never in client-side code

// Check if service role key is available
if (!supabaseServiceRoleKey) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY is not defined. Admin operations will not work."
  );
}

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "budget-tracker-admin",
      },
      // Increase timeout for queries
      fetch: (url, options = {}) => {
        const timeout = 30000; // 30 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        })
          .then((response) => {
            clearTimeout(timeoutId);
            return response;
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            throw error;
          });
      },
    },
  }
);

// Function to check database connection health and reset if needed
export const checkDatabaseConnection = async (
  useAdmin = false
): Promise<boolean> => {
  try {
    console.log(
      `Checking database connection health (${
        useAdmin ? "admin" : "regular"
      } client)...`
    );
    const client = useAdmin ? supabaseAdmin : supabase;

    // Try a simple query that doesn't depend on user authentication
    // First try with categories table which should have less restrictive RLS
    try {
      // Try a simple query to the categories table
      const { error: categoriesError } = await client
        .from("categories")
        .select("count(*)", { count: "exact", head: true });

      if (!categoriesError) {
        console.log(
          `Database connection is healthy (${
            useAdmin ? "admin" : "regular"
          } client)`
        );
        return true;
      }

      console.log("Categories health check failed, trying transactions...");

      // If categories fails, try transactions
      const { error: transactionsError } = await client
        .from("transactions")
        .select("count(*)", { count: "exact", head: true });

      if (!transactionsError) {
        console.log(
          `Database connection is healthy (${
            useAdmin ? "admin" : "regular"
          } client)`
        );
        return true;
      }

      // If both fail, try a direct SQL query using the REST API
      try {
        // Use a simple fetch to bypass TypeScript restrictions
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: "GET",
          headers: {
            apikey: useAdmin ? supabaseServiceRoleKey || "" : supabaseAnonKey,
            Authorization: `Bearer ${
              useAdmin ? supabaseServiceRoleKey || "" : supabaseAnonKey
            }`,
          },
        });

        if (response.ok) {
          console.log(
            `Database connection is healthy (${
              useAdmin ? "admin" : "regular"
            } client)`
          );
          return true;
        }
      } catch (e) {
        console.error("Direct API health check failed:", e);
      }

      // All attempts failed
      console.error("All health check attempts failed");
      return false;
    } catch (queryError) {
      console.error("Error during health check query:", queryError);
      return false;
    }
  } catch (error) {
    console.error(
      `Error checking database connection (${
        useAdmin ? "admin" : "regular"
      } client):`,
      error
    );
    return false;
  }
};
