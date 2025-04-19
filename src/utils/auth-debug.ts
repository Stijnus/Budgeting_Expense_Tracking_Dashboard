import { supabase, supabaseAdmin } from "../api/supabase/client";
import { updateUserRole } from "../api/supabase/auth";

/**
 * Utility functions to help debug and fix authentication issues
 * These should only be used during development or by administrators
 */

/**
 * Check if a user exists in the auth.users table
 */
export const checkUserExists = async (email: string) => {
  try {
    console.log(`Checking if user exists: ${email}`);

    // This requires admin privileges
    const { data, error } = await supabaseAdmin.rpc("admin_check_user_exists", {
      email_to_check: email,
    });

    if (error) {
      console.error("Error checking user existence:", error);
      return { exists: false, error };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error("Unexpected error checking user existence:", error);
    return { exists: false, error };
  }
};

/**
 * Check if a user profile exists
 */
export const checkProfileExists = async (email: string) => {
  try {
    console.log(`Checking if profile exists: ${email}`);

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, role")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Error checking profile existence:", error);
      return { exists: false, error, profile: null };
    }

    return { exists: !!data, error: null, profile: data };
  } catch (error) {
    console.error("Unexpected error checking profile existence:", error);
    return { exists: false, error, profile: null };
  }
};

/**
 * Fix user role - can be used to set a user's role to user, admin, or superuser
 */
export const fixUserRole = async (
  userId: string,
  role: "user" | "admin" | "superuser"
) => {
  try {
    return await updateUserRole(userId, role);
  } catch (error) {
    console.error("Error fixing user role:", error);
    return { success: false, error };
  }
};

/**
 * Clear all auth data from local storage
 */
export const clearAuthData = () => {
  console.log("Clearing all auth data from local storage");

  // Clear Supabase auth data
  const authKeys = Object.keys(localStorage).filter(
    (key) => key.startsWith("supabase.auth.") || key.includes("token")
  );

  authKeys.forEach((key) => {
    console.log(`Removing: ${key}`);
    localStorage.removeItem(key);
  });

  // Also clear from session storage
  const sessionKeys = Object.keys(sessionStorage).filter(
    (key) => key.startsWith("supabase.auth.") || key.includes("token")
  );

  sessionKeys.forEach((key) => {
    console.log(`Removing from session storage: ${key}`);
    sessionStorage.removeItem(key);
  });

  return { success: true, keysCleared: [...authKeys, ...sessionKeys] };
};

/**
 * Get current auth status
 */
export const getAuthStatus = async () => {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return {
        authenticated: false,
        error: sessionError,
        user: null,
        session: null,
      };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      return {
        authenticated: !!sessionData.session,
        error: userError,
        user: null,
        session: sessionData.session,
      };
    }

    return {
      authenticated: !!userData.user,
      error: null,
      user: userData.user,
      session: sessionData.session,
    };
  } catch (error) {
    console.error("Unexpected error getting auth status:", error);
    return { authenticated: false, error, user: null, session: null };
  }
};

/**
 * Diagnose session issues
 */
export const diagnoseSessionIssues = async () => {
  console.log("Diagnosing session issues...");

  // Check current auth status
  const authStatus = await getAuthStatus();
  console.log(
    "Current auth status:",
    authStatus.authenticated ? "Authenticated" : "Not authenticated"
  );

  // Check local storage for auth tokens
  const authKeys = Object.keys(localStorage).filter(
    (key) => key.startsWith("supabase.auth.") || key.includes("token")
  );

  console.log(`Found ${authKeys.length} auth-related keys in localStorage:`);
  authKeys.forEach((key) => console.log(`- ${key}`));

  // Check session storage
  const sessionKeys = Object.keys(sessionStorage).filter(
    (key) => key.startsWith("supabase.auth.") || key.includes("token")
  );

  console.log(
    `Found ${sessionKeys.length} auth-related keys in sessionStorage:`
  );
  sessionKeys.forEach((key) => console.log(`- ${key}`));

  // Try to refresh the session
  try {
    console.log("Attempting to refresh session...");
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();

    if (refreshError) {
      console.error("Session refresh failed:", refreshError);
    } else if (refreshData.session) {
      console.log("Session successfully refreshed");
    } else {
      console.log("No session returned from refresh attempt");
    }
  } catch (error) {
    console.error("Error during session refresh:", error);
  }

  return {
    authStatus,
    localStorageKeys: authKeys,
    sessionStorageKeys: sessionKeys,
  };
};

/**
 * Fix session issues by refreshing the token
 */
export const fixSessionIssues = async () => {
  console.log("Attempting to fix session issues...");

  try {
    // First try refreshing the session
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();

    if (refreshError) {
      console.error("Session refresh failed:", refreshError);
      return { success: false, error: refreshError };
    }

    if (refreshData.session) {
      console.log("Session successfully refreshed");
      return { success: true, session: refreshData.session };
    }

    console.log("No session returned from refresh attempt");
    return { success: false, error: "No session returned" };
  } catch (error) {
    console.error("Error fixing session:", error);
    return { success: false, error };
  }
};
