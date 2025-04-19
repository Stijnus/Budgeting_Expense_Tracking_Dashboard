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
 * Clean up potentially conflicting auth data
 * This is less aggressive than clearAuthData and only removes problematic items
 */
export const cleanupAuthData = () => {
  console.log("Cleaning up potentially conflicting auth data");

  const problematicPatterns = [
    // Duplicate or stale tokens
    "supabase.auth.token.stale",
    "supabase.auth.refreshToken",
    // Any expired tokens
    "supabase.auth.token.expired",
    // Temporary auth data
    "supabase.auth.token.temp",
  ];

  const cleanedKeys: string[] = [];

  // Check for duplicate auth tokens (multiple tokens with different timestamps)
  const authTokens = Object.keys(localStorage).filter(
    (key) =>
      key.startsWith("supabase.auth.token") &&
      !problematicPatterns.some((pattern) => key.includes(pattern))
  );

  // If we have multiple auth tokens, keep only the most recent one
  if (authTokens.length > 1) {
    console.log(
      `Found ${authTokens.length} auth tokens, cleaning up duplicates`
    );

    // Sort by key (which often contains timestamp) to find the most recent
    const sortedTokens = [...authTokens].sort();
    const tokensToRemove = sortedTokens.slice(0, -1); // Remove all but the last one

    tokensToRemove.forEach((key) => {
      console.log(`Removing duplicate token: ${key}`);
      localStorage.removeItem(key);
      cleanedKeys.push(key);
    });
  }

  // Clean up problematic patterns
  problematicPatterns.forEach((pattern) => {
    // Check localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.includes(pattern)) {
        console.log(`Removing problematic localStorage item: ${key}`);
        localStorage.removeItem(key);
        cleanedKeys.push(key);
      }
    });

    // Check sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.includes(pattern)) {
        console.log(`Removing problematic sessionStorage item: ${key}`);
        sessionStorage.removeItem(key);
        cleanedKeys.push(key);
      }
    });
  });

  return { success: true, keysCleared: cleanedKeys };
};

/**
 * Check for inconsistent auth state and fix it
 */
export const checkAndFixAuthState = async () => {
  console.log("Checking for inconsistent auth state...");

  try {
    // Get current session and user
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check for inconsistencies
    const hasLocalStorageSession = Object.keys(localStorage).some((key) =>
      key.startsWith("supabase.auth.token")
    );

    const hasSessionStorageSession = Object.keys(sessionStorage).some((key) =>
      key.startsWith("supabase.auth.token")
    );

    // Case 1: We have tokens in storage but no session
    if ((hasLocalStorageSession || hasSessionStorageSession) && !session) {
      console.log("Found tokens in storage but no active session, cleaning up");
      cleanupAuthData();
      return { fixed: true, action: "cleaned_stale_tokens" };
    }

    // Case 2: We have a session but no user
    if (session && !user) {
      console.log("Found session but no user, attempting to refresh");
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        console.log("Failed to refresh session, cleaning up");
        cleanupAuthData();
        return { fixed: true, action: "cleaned_invalid_session" };
      }

      return { fixed: true, action: "refreshed_session" };
    }

    // Case 3: Everything looks good
    if (session && user) {
      console.log("Auth state looks consistent");
      return { fixed: false, action: "none_needed" };
    }

    // Case 4: No session and no tokens (logged out state)
    if (!session && !hasLocalStorageSession && !hasSessionStorageSession) {
      console.log("No session or tokens found (logged out state)");
      return { fixed: false, action: "none_needed" };
    }

    // Default case: Do a light cleanup just to be safe
    console.log("Performing light cleanup as a precaution");
    cleanupAuthData();
    return { fixed: true, action: "preventive_cleanup" };
  } catch (error) {
    console.error("Error checking auth state:", error);
    return { fixed: false, error, action: "error" };
  }
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
