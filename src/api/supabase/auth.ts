import { supabase, supabaseAdmin } from "./client";
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

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  try {
    console.log("getUserProfile: Starting profile fetch for user:", userId);
    console.log("getUserProfile: Using regular client...");

    // Add timeout for regular client query
    const regularClientPromise = supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Query timeout")), 5000);
    });

    try {
      const { data, error } = (await Promise.race([
        regularClientPromise,
        timeoutPromise,
      ])) as PostgrestSingleResponse<UserProfile>;

      if (error) {
        console.error(
          "getUserProfile: Error fetching with regular client:",
          error,
          "\nError details:",
          JSON.stringify(error, null, 2)
        );
        throw error;
      }

      if (!data) {
        console.log(
          "getUserProfile: No profile found with regular client, attempting profile creation..."
        );
        // Try to create the profile
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user?.email) {
          throw new Error("No user email available for profile creation");
        }

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

      console.log(
        "getUserProfile: Successfully fetched profile with regular client:",
        data
      );
      return data;
    } catch (queryError) {
      if (
        queryError instanceof Error &&
        queryError.message === "Query timeout"
      ) {
        console.error("getUserProfile: Regular client query timed out");
        // Try admin client on timeout
        console.log(
          "getUserProfile: Attempting with admin client after timeout..."
        );
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (adminError) {
          console.error(
            "getUserProfile: Admin client error after timeout:",
            adminError,
            "\nError details:",
            JSON.stringify(adminError, null, 2)
          );
          throw adminError;
        }

        console.log(
          "getUserProfile: Successfully fetched profile with admin client after timeout:",
          adminData
        );
        return adminData;
      }
      throw queryError;
    }
  } catch (error) {
    console.error(
      "getUserProfile: Unexpected error:",
      error,
      "\nError details:",
      error instanceof Error ? error.stack : JSON.stringify(error, null, 2)
    );
    throw error;
  }
};
