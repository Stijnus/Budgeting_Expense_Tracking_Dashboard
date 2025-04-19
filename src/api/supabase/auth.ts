import { supabase, supabaseAdmin, checkDatabaseConnection } from "./client";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

// Helper function to get the current user
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Helper function to get user profile with retry mechanism and connection health checks
// Helper function to update user role
export const updateUserRole = async (
  userId: string,
  role: "user" | "admin" | "superuser"
) => {
  try {
    console.log(`updateUserRole: Updating role for user ${userId} to ${role}`);

    // Try with regular client first
    const { error } = await supabase
      .from("user_profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      console.error(
        "updateUserRole: Error updating with regular client:",
        error
      );

      // Try with admin client if regular client fails
      console.log("updateUserRole: Trying with admin client...");
      const { error: adminError } = await supabaseAdmin
        .from("user_profiles")
        .update({ role })
        .eq("id", userId);

      if (adminError) {
        console.error(
          "updateUserRole: Error updating with admin client:",
          adminError
        );
        throw adminError;
      }

      console.log(
        "updateUserRole: Successfully updated role with admin client"
      );
      return { success: true };
    }

    console.log(
      "updateUserRole: Successfully updated role with regular client"
    );
    return { success: true };
  } catch (error) {
    console.error("updateUserRole: Unexpected error:", error);
    throw error;
  }
};

// Helper function to create a fallback profile when database access fails
async function createFallbackProfile(userId: string): Promise<UserProfile> {
  console.log(
    "createFallbackProfile: Creating fallback profile for user",
    userId
  );
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      // Return a minimal profile with just the essential information
      // This will allow basic app functionality until the database connection is restored
      // Use 'user' as the default role for fallback profiles
      const fallbackRole = "user"; // Valid values: 'user', 'admin', 'superuser'

      console.log(
        "createFallbackProfile: Creating profile with role:",
        fallbackRole
      );

      const fallbackProfile = {
        id: userId,
        email: userData.user.email || "unknown@example.com",
        first_name: userData.user.user_metadata?.first_name || "User",
        last_name: userData.user.user_metadata?.last_name || "",
        role: fallbackRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone_number: null,
        avatar_url: null,
      } as UserProfile;

      console.log(
        "createFallbackProfile: Using fallback profile:",
        fallbackProfile
      );

      // Return the fallback profile directly
      return fallbackProfile;
    }
    throw new Error("No user data available for fallback profile");
  } catch (fallbackError) {
    console.error(
      "createFallbackProfile: Error creating fallback profile:",
      fallbackError
    );
    // Create a minimal profile even if we can't get user data
    const minimalProfile = {
      id: userId,
      email: "unknown@example.com",
      first_name: "User",
      last_name: "",
      role: "user" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phone_number: null,
      avatar_url: null,
    };
    return minimalProfile;
  }
}

export const getUserProfile = async (userId: string) => {
  try {
    console.log("getUserProfile: Starting profile fetch for user:", userId);

    // Try to fetch the profile with the regular client first
    try {
      // Check database connection health
      const isConnectionHealthy = await checkDatabaseConnection(false);
      if (!isConnectionHealthy) {
        console.log(
          "getUserProfile: Regular client connection unhealthy, trying admin client"
        );
        // Try admin client
        const adminConnectionHealthy = await checkDatabaseConnection(true);
        if (!adminConnectionHealthy) {
          console.log(
            "getUserProfile: Both clients unhealthy, using fallback profile"
          );
          return await createFallbackProfile(userId);
        }
      }

      // Try to fetch the profile with a timeout
      const client = isConnectionHealthy ? supabase : supabaseAdmin;
      const clientName = isConnectionHealthy ? "regular" : "admin";

      console.log(
        `getUserProfile: Attempting to fetch profile with ${clientName} client`
      );

      // Add timeout for client query
      const clientPromise = client
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Query timeout")), 15000); // 15 second timeout
      });

      const { data, error } = (await Promise.race([
        clientPromise,
        timeoutPromise,
      ])) as PostgrestSingleResponse<UserProfile>;

      if (error) {
        console.error(
          `getUserProfile: Error fetching with ${clientName} client:`,
          error
        );

        // If regular client failed, try admin client
        if (clientName === "regular") {
          console.log("getUserProfile: Trying with admin client instead");
          const { data: adminData, error: adminError } = await supabaseAdmin
            .from("user_profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (adminError) {
            console.error(
              "getUserProfile: Admin client also failed",
              adminError
            );
            // Both clients failed, use fallback profile
            return await createFallbackProfile(userId);
          }

          console.log(
            "getUserProfile: Successfully fetched profile with admin client"
          );
          return adminData;
        }

        // Admin client failed, use fallback profile
        return await createFallbackProfile(userId);
      }

      if (!data) {
        console.log(
          "getUserProfile: No profile found, attempting to create one"
        );
        return await createUserProfile(userId);
      }

      console.log("getUserProfile: Successfully fetched profile");
      return data;
    } catch (error) {
      console.error("getUserProfile: Error during profile fetch:", error);
      return await createFallbackProfile(userId);
    }
  } catch (error) {
    // This catch block handles any errors not caught by the inner try/catch
    console.error(
      "getUserProfile: Unexpected error:",
      error,
      "\nError details:",
      error instanceof Error ? error.stack : JSON.stringify(error, null, 2)
    );

    // For any error, return a fallback profile
    return await createFallbackProfile(userId);
  }
};

// Helper function to create a user profile in the database
async function createUserProfile(userId: string): Promise<UserProfile> {
  console.log("createUserProfile: Creating new profile for user", userId);
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) {
      throw new Error("No user email available for profile creation");
    }

    // Default role is 'user'
    const userRole = "user"; // Valid values: 'user', 'admin', 'superuser'

    console.log("createUserProfile: Creating profile with role:", userRole);

    const { data: newProfile, error: createError } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        email: userData.user.email,
        first_name: userData.user.user_metadata?.first_name || "New",
        last_name: userData.user.user_metadata?.last_name || "User",
        role: userRole,
      } as UserProfile)
      .select()
      .single();

    if (createError) {
      console.error("createUserProfile: Error creating profile:", createError);

      // Try creating profile with admin client
      console.log("createUserProfile: Trying with admin client");

      const { data: adminCreatedProfile, error: adminCreateError } =
        await supabaseAdmin
          .from("user_profiles")
          .insert({
            id: userId,
            email: userData.user.email,
            first_name: userData.user.user_metadata?.first_name || "New",
            last_name: userData.user.user_metadata?.last_name || "User",
            role: userRole,
          } as UserProfile)
          .select()
          .single();

      if (adminCreateError) {
        console.error(
          "createUserProfile: Admin client also failed:",
          adminCreateError
        );
        return await createFallbackProfile(userId);
      }

      console.log(
        "createUserProfile: Successfully created profile with admin client"
      );
      return adminCreatedProfile;
    }

    console.log("createUserProfile: Successfully created profile");
    return newProfile;
  } catch (error) {
    console.error("createUserProfile: Unexpected error:", error);
    return await createFallbackProfile(userId);
  }
}
