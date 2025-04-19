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
export const getUserProfile = async (userId: string) => {
  try {
    console.log("getUserProfile: Starting profile fetch for user:", userId);

    // Function to attempt profile fetch with retry logic
    const fetchProfileWithRetry = async (
      useAdmin = false,
      retryCount = 0,
      maxRetries = 2
    ) => {
      const client = useAdmin ? supabaseAdmin : supabase;
      const clientName = useAdmin ? "admin" : "regular";

      console.log(
        `getUserProfile: Attempt ${
          retryCount + 1
        } using ${clientName} client...`
      );

      // Check database connection health before attempting query
      const isConnectionHealthy = await checkDatabaseConnection(useAdmin);
      if (!isConnectionHealthy && !useAdmin && retryCount === 0) {
        console.log(
          "getUserProfile: Regular client connection unhealthy, switching to admin client"
        );
        return await fetchProfileWithRetry(true, 0, maxRetries);
      } else if (!isConnectionHealthy) {
        console.log(
          `getUserProfile: ${clientName} client connection unhealthy, retrying...`
        );
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (retryCount < maxRetries) {
          return await fetchProfileWithRetry(
            useAdmin,
            retryCount + 1,
            maxRetries
          );
        } else if (!useAdmin) {
          return await fetchProfileWithRetry(true, 0, maxRetries);
        } else {
          throw new Error(
            `Database connection is unhealthy after multiple attempts`
          );
        }
      }

      // Add timeout for client query
      const clientPromise = client
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Query timeout")), 15000); // 15 second timeout
      });

      try {
        const { data, error } = (await Promise.race([
          clientPromise,
          timeoutPromise,
        ])) as PostgrestSingleResponse<UserProfile>;

        if (error) {
          console.error(
            `getUserProfile: Error fetching with ${clientName} client:`,
            error,
            "\nError details:",
            JSON.stringify(error, null, 2)
          );

          // If we have retries left, try again
          if (retryCount < maxRetries) {
            console.log(
              `getUserProfile: Retrying... (${retryCount + 1}/${maxRetries})`
            );
            return await fetchProfileWithRetry(
              useAdmin,
              retryCount + 1,
              maxRetries
            );
          }

          // If we're using regular client and out of retries, try admin client
          if (!useAdmin) {
            console.log(
              "getUserProfile: Switching to admin client after regular client failures"
            );
            return await fetchProfileWithRetry(true, 0, maxRetries);
          }

          throw error;
        }

        return data;
      } catch (queryError) {
        if (
          queryError instanceof Error &&
          queryError.message === "Query timeout"
        ) {
          console.error(`getUserProfile: ${clientName} client query timed out`);

          // If we have retries left, try again
          if (retryCount < maxRetries) {
            console.log(
              `getUserProfile: Retrying after timeout... (${
                retryCount + 1
              }/${maxRetries})`
            );
            return await fetchProfileWithRetry(
              useAdmin,
              retryCount + 1,
              maxRetries
            );
          }

          // If we're using regular client and out of retries, try admin client
          if (!useAdmin) {
            console.log(
              "getUserProfile: Switching to admin client after timeout"
            );
            return await fetchProfileWithRetry(true, 0, maxRetries);
          }

          throw new Error(`Profile fetch timed out after multiple attempts`);
        }
        throw queryError;
      }
    };

    // Start with regular client
    const data = await fetchProfileWithRetry(false);

    if (!data) {
      console.log(
        "getUserProfile: No profile found, attempting profile creation..."
      );
      // Try to create the profile
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        throw new Error("No user email available for profile creation");
      }

      // Try to create the profile
      const { data: newProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          email: userData.user.email,
          first_name: userData.user.user_metadata?.first_name || "New",
          last_name: userData.user.user_metadata?.last_name || "User",
          role: "user",
        })
        .select()
        .single();

      if (createError) {
        console.error(
          "getUserProfile: Error creating profile:",
          createError,
          "\nError details:",
          JSON.stringify(createError, null, 2)
        );

        // Try creating profile with admin client
        console.log(
          "getUserProfile: Attempting profile creation with admin client..."
        );
        const { data: adminCreatedProfile, error: adminCreateError } =
          await supabaseAdmin
            .from("user_profiles")
            .insert({
              id: userId,
              email: userData.user.email,
              first_name: userData.user.user_metadata?.first_name || "New",
              last_name: userData.user.user_metadata?.last_name || "User",
              role: "user",
            })
            .select()
            .single();

        if (adminCreateError) {
          console.error(
            "getUserProfile: Admin client profile creation error:",
            adminCreateError,
            "\nError details:",
            JSON.stringify(adminCreateError, null, 2)
          );
          throw adminCreateError;
        }

        console.log(
          "getUserProfile: Successfully created profile with admin client:",
          adminCreatedProfile
        );
        return adminCreatedProfile;
      }

      console.log(
        "getUserProfile: Successfully created new profile:",
        newProfile
      );
      return newProfile;
    }

    console.log("getUserProfile: Successfully fetched profile:", data);
    return data;
  } catch (error) {
    // This catch block handles any errors not caught by the retry mechanism
    console.error(
      "getUserProfile: Unexpected error:",
      error,
      "\nError details:",
      error instanceof Error ? error.stack : JSON.stringify(error, null, 2)
    );

    // If we have a session but can't get the profile, return a minimal profile
    // This allows the user to continue using the app even if the database is down
    if (
      error instanceof Error &&
      (error.message.includes("timeout") ||
        error.message.includes("unhealthy") ||
        error.message.includes("connection"))
    ) {
      console.log(
        "getUserProfile: Creating fallback profile due to connection issues"
      );
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          // Return a minimal profile with just the essential information
          // This will allow basic app functionality until the database connection is restored
          const fallbackProfile = {
            id: userId,
            email: userData.user.email || "unknown@example.com",
            first_name: userData.user.user_metadata?.first_name || "User",
            last_name: userData.user.user_metadata?.last_name || "",
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone_number: null,
            avatar_url: null,
          } as UserProfile;

          console.log(
            "getUserProfile: Using fallback profile:",
            fallbackProfile
          );
          // Include the fallback profile in the error message so it can be extracted if needed
          const fallbackProfileError = new Error(
            `Database connection issues, using fallback profile: ${JSON.stringify(
              fallbackProfile
            )}`
          );
          throw fallbackProfileError;
        }
      } catch (fallbackError) {
        console.error(
          "getUserProfile: Error creating fallback profile:",
          fallbackError
        );
      }
    }

    throw error;
  }
};
