import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../../api/supabase/client";
import { getUserProfile } from "../../api/supabase/auth";
import { AuthContext, type UserProfile } from "./auth-context";
import { cleanupAuthData } from "../../utils/auth-debug";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUsingFallbackProfile, setIsUsingFallbackProfile] = useState(false);

  const createProfile = async (user: User) => {
    console.log("AuthProvider: Creating new user profile...");
    try {
      if (!user.email) {
        throw new Error("User email is required for profile creation");
      }

      const { error } = await supabase.from("user_profiles").insert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || "New",
        last_name: user.user_metadata?.last_name || "User",
        role: "user" as const,
      });

      if (error) throw error;

      // Fetch the newly created profile
      return await getUserProfile(user.id);
    } catch (error) {
      console.error("AuthProvider: Error creating user profile:", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Starting initialization");

    // Safety timeout to prevent getting stuck in loading state
    const safetyTimeoutId = setTimeout(() => {
      console.log(
        "AuthProvider: Safety timeout triggered, resetting loading state"
      );
      setLoading(false);
    }, 10000); // 10 second safety timeout

    // Get initial session
    const initializeAuth = async () => {
      console.log("AuthProvider: Initializing auth...");
      try {
        // First, check if we have a session in localStorage that might be stale
        const hasLocalStorageSession = Object.keys(localStorage).some(
          (key) =>
            key.startsWith("supabase.auth.token") ||
            key.includes("supabase.auth.refreshToken")
        );

        // Get current session from Supabase
        let {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log(
          "AuthProvider: Got session:",
          session ? "Session exists" : "No session",
          "Local storage session:",
          hasLocalStorageSession ? "Exists" : "None"
        );

        // Handle session error (but not just missing session)
        if (sessionError) {
          console.log(
            "AuthProvider: Session error detected, cleaning up session..."
          );
          // Use the less aggressive cleanup first
          cleanupAuthData();
          // If we still have a session error after cleanup, clear everything
          const { error: retryError } = await supabase.auth.getSession();
          if (retryError) {
            console.log(
              "AuthProvider: Session error persists after cleanup, clearing session..."
            );
            clearSession();
          }
          setLoading(false);
          return;
        }

        // Only clear if we have local storage tokens but Supabase reports no session
        // This is a more conservative approach to avoid clearing valid sessions
        if (hasLocalStorageSession && !session) {
          console.log(
            "AuthProvider: Potential stale session detected, attempting refresh..."
          );
          try {
            // Try to refresh the session before clearing
            const { data: refreshData, error: refreshError } =
              await supabase.auth.refreshSession();

            if (refreshError || !refreshData.session) {
              console.log(
                "AuthProvider: Session refresh failed, cleaning up stale session..."
              );
              // Try the less aggressive cleanup first
              cleanupAuthData();
              // If we still don't have a session after cleanup, clear everything
              const { data: retryData } = await supabase.auth.getSession();
              if (!retryData.session) {
                console.log(
                  "AuthProvider: No session after cleanup, clearing all auth data"
                );
                clearSession();
                setLoading(false);
                return;
              } else {
                console.log("AuthProvider: Session recovered after cleanup");
                session = retryData.session;
              }
            } else {
              // Session was successfully refreshed
              console.log("AuthProvider: Session successfully refreshed");
              session = refreshData.session;
            }
          } catch (refreshException) {
            console.error(
              "AuthProvider: Error during session refresh:",
              refreshException
            );
            clearSession();
            setLoading(false);
            return;
          }
        }

        if (session?.user) {
          setUser(session.user);
          console.log("AuthProvider: Fetching user profile...");

          // Set a timeout for profile fetching to prevent getting stuck in loading state
          const initialProfileTimeoutId = setTimeout(() => {
            console.log(
              "AuthProvider: Initial profile fetch timeout reached, setting loading to false"
            );
            setLoading(false);
          }, 5000); // 5 second timeout for profile fetch

          try {
            try {
              let userProfile = await getUserProfile(session.user.id);
              // Clear the timeout since we got a response
              clearTimeout(initialProfileTimeoutId);

              // Check if this is a fallback profile
              const isFallback =
                userProfile &&
                !userProfile.created_at.includes("T") &&
                new Date(userProfile.created_at).getTime() > Date.now() - 60000; // Created in the last minute

              setIsUsingFallbackProfile(!!isFallback);

              if (isFallback) {
                console.log(
                  "AuthProvider: Using fallback profile due to database issues"
                );
              }

              if (!userProfile) {
                console.log(
                  "AuthProvider: No profile found, creating new profile..."
                );
                userProfile = await createProfile(session.user);
                setIsUsingFallbackProfile(false);
              }

              console.log(
                "AuthProvider: Got user profile:",
                userProfile ? "Profile exists" : "No profile"
              );
              setProfile(userProfile);
            } catch (fetchError) {
              // Clear the timeout since we got a response (even if it's an error)
              clearTimeout(initialProfileTimeoutId);
              console.error(
                "AuthProvider: Error fetching profile:",
                fetchError
              );

              // Check if the error message indicates a fallback profile was created
              if (
                fetchError instanceof Error &&
                fetchError.message.includes("fallback profile")
              ) {
                // Extract the fallback profile from the error message if possible
                try {
                  const errorJson = JSON.parse(
                    fetchError.message.split("fallback profile:")[1]
                  );
                  if (errorJson && errorJson.id === session.user.id) {
                    setProfile(errorJson);
                    setIsUsingFallbackProfile(true);
                    console.log(
                      "AuthProvider: Using fallback profile from error"
                    );
                  } else {
                    // If we can't get the profile, the session might be invalid
                    clearSession();
                  }
                } catch (parseError) {
                  // If we can't parse the error, the session might be invalid
                  clearSession();
                }
              } else {
                // Don't clear session just because we can't get the profile
                // This allows the user to stay logged in even if profile fetch fails
                console.log(
                  "AuthProvider: Could not get profile, but keeping session active"
                );
                setProfile(null);
              }
            }
          } catch (profileError) {
            // Clear the timeout since we got a response (even if it's an error)
            clearTimeout(initialProfileTimeoutId);
            console.error(
              "AuthProvider: Error fetching initial profile:",
              profileError
            );
            // Don't clear session just because we can't get the profile
            console.log(
              "AuthProvider: Error fetching profile, but keeping session active"
            );
            setProfile(null);
          } finally {
            setLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("AuthProvider: Error initializing auth:", error);
        clearSession();
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    console.log("AuthProvider: Setting up auth state change listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "AuthProvider: Auth state changed:",
        event,
        session ? "Session exists" : "No session"
      );

      // Handle specific auth events
      if (event === "SIGNED_OUT") {
        console.log(
          `AuthProvider: Handling ${event} event, clearing session...`
        );
        clearSession();
        setLoading(false);
        return;
      }

      // Handle token refresh events
      if (event === "TOKEN_REFRESHED") {
        if (!session) {
          console.log(
            "AuthProvider: Token refresh failed, clearing session..."
          );
          clearSession();
          setLoading(false);
          return;
        } else {
          console.log("AuthProvider: Token successfully refreshed");
          // Continue with the updated session
        }
      }

      if (session?.user) {
        setUser(session.user);

        // Set a timeout for profile fetching to prevent getting stuck in loading state
        const profileTimeoutId = setTimeout(() => {
          console.log(
            "AuthProvider: Profile fetch timeout reached, setting loading to false"
          );
          setLoading(false);
        }, 5000); // 5 second timeout for profile fetch

        try {
          console.log(
            "AuthProvider: Fetching user profile after auth change..."
          );
          try {
            const userProfile = await getUserProfile(session.user.id);
            // Clear the timeout since we got a response
            clearTimeout(profileTimeoutId);

            console.log(
              "AuthProvider: Got user profile after auth change:",
              userProfile ? "Profile exists" : "No profile"
            );

            // Check if this is a fallback profile
            const isFallback =
              userProfile &&
              !userProfile.created_at.includes("T") &&
              new Date(userProfile.created_at).getTime() > Date.now() - 60000; // Created in the last minute

            setIsUsingFallbackProfile(!!isFallback);

            if (isFallback) {
              console.log(
                "AuthProvider: Using fallback profile due to database issues"
              );
            }

            setProfile(userProfile);
          } catch (fetchError) {
            // Clear the timeout since we got a response (even if it's an error)
            clearTimeout(profileTimeoutId);
            console.error("AuthProvider: Error fetching profile:", fetchError);

            // Check if the error message indicates a fallback profile was created
            if (
              fetchError instanceof Error &&
              fetchError.message.includes("fallback profile")
            ) {
              // Extract the fallback profile from the error message if possible
              try {
                const errorJson = JSON.parse(
                  fetchError.message.split("fallback profile:")[1]
                );
                if (errorJson && errorJson.id === session.user.id) {
                  setProfile(errorJson);
                  setIsUsingFallbackProfile(true);
                  console.log(
                    "AuthProvider: Using fallback profile from error"
                  );
                }
              } catch (parseError) {
                // If we can't parse the error, just set profile to null
                setProfile(null);
                setIsUsingFallbackProfile(false);
              }
            } else {
              // Don't clear session on profile fetch error, just set profile to null
              setProfile(null);
              setIsUsingFallbackProfile(false);
            }
          }
        } catch (error) {
          // Clear the timeout since we got a response (even if it's an error)
          clearTimeout(profileTimeoutId);
          console.error("AuthProvider: Error fetching user profile:", error);
          // Don't clear session on profile fetch error, just set profile to null
          setProfile(null);
          setIsUsingFallbackProfile(false);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider: Cleaning up auth state change listener");
      clearTimeout(safetyTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("AuthProvider: Starting sign in process...");
    setLoading(true);
    try {
      console.log("AuthProvider: Attempting to sign in with Supabase...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log(
        "AuthProvider: Sign in result:",
        error ? "Error occurred" : "Success",
        data?.user ? "User exists" : "No user",
        error ? `Error: ${error.message}` : ""
      );

      if (!error && data.user) {
        console.log("AuthProvider: Setting user in state...");
        setUser(data.user);
        try {
          console.log("AuthProvider: Fetching user profile...");
          try {
            const userProfile = await getUserProfile(data.user.id);
            console.log(
              "AuthProvider: Profile fetch result:",
              userProfile ? "Success" : "No profile found"
            );

            // Check if this is a fallback profile
            const isFallback =
              userProfile &&
              !userProfile.created_at.includes("T") &&
              new Date(userProfile.created_at).getTime() > Date.now() - 60000; // Created in the last minute

            setIsUsingFallbackProfile(!!isFallback);

            if (isFallback) {
              console.log(
                "AuthProvider: Using fallback profile due to database issues"
              );
            }

            if (!userProfile) {
              console.log("AuthProvider: Creating new profile...");
              try {
                const newProfile = await createProfile(data.user);
                setProfile(newProfile);
                setIsUsingFallbackProfile(false);
              } catch (createError) {
                console.error(
                  "AuthProvider: Error creating profile:",
                  createError
                );
                // Don't block sign in on profile creation error
                setProfile(null);
                setIsUsingFallbackProfile(false);
              }
            } else {
              setProfile(userProfile);
            }
          } catch (fetchError) {
            console.error("AuthProvider: Error fetching profile:", fetchError);

            // Check if the error message indicates a fallback profile was created
            if (
              fetchError instanceof Error &&
              fetchError.message.includes("fallback profile")
            ) {
              // Extract the fallback profile from the error message if possible
              try {
                const errorJson = JSON.parse(
                  fetchError.message.split("fallback profile:")[1]
                );
                if (errorJson && errorJson.id === data.user.id) {
                  setProfile(errorJson);
                  setIsUsingFallbackProfile(true);
                  console.log(
                    "AuthProvider: Using fallback profile from error"
                  );
                }
              } catch (parseError) {
                // If we can't parse the error, just set profile to null
                setProfile(null);
                setIsUsingFallbackProfile(false);
              }
            } else {
              // Don't block sign in on profile fetch error
              setProfile(null);
              setIsUsingFallbackProfile(false);
            }
          }
        } catch (profileError) {
          console.error(
            "AuthProvider: Error fetching profile after sign in:",
            profileError
          );
          // Don't block sign in on profile fetch error
          setProfile(null);
        }
      }

      return { error };
    } catch (error) {
      console.error("AuthProvider: Unexpected error during sign in:", error);
      throw error;
    } finally {
      console.log(
        "AuthProvider: Sign in process complete, setting loading to false"
      );
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    options?: { data?: { first_name?: string; last_name?: string } }
  ) => {
    console.log("AuthProvider: Starting sign up process...");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: options?.data,
        },
      });
      console.log(
        "AuthProvider: Sign up result:",
        error ? "Error occurred" : "Success"
      );
      return { error };
    } finally {
      console.log(
        "AuthProvider: Sign up process complete, setting loading to false"
      );
      setLoading(false);
    }
  };

  const clearSession = () => {
    console.log("AuthProvider: Clearing session state...");
    // Clear auth state from context
    setUser(null);
    setProfile(null);
    setIsUsingFallbackProfile(false);

    try {
      // Clear storage in a more targeted way
      // Only remove Supabase auth-related items
      const authKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("supabase.auth.")
      );
      authKeys.forEach((key) => {
        console.log(`AuthProvider: Removing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });

      const sessionKeys = Object.keys(sessionStorage).filter((key) =>
        key.startsWith("supabase.auth.")
      );
      sessionKeys.forEach((key) => {
        console.log(`AuthProvider: Removing sessionStorage key: ${key}`);
        sessionStorage.removeItem(key);
      });

      console.log("AuthProvider: Session state cleared");
    } catch (error) {
      console.error("AuthProvider: Error clearing session storage:", error);
    }
  };

  const signOut = async () => {
    console.log("AuthProvider: Starting sign out process...");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      console.log(
        "AuthProvider: Sign out result:",
        error ? "Error occurred" : "Success"
      );
      // Clear any remaining auth state
      clearSession();
      return { error };
    } finally {
      console.log(
        "AuthProvider: Sign out process complete, setting loading to false"
      );
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log("AuthProvider: Starting password reset process...");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    console.log(
      "AuthProvider: Password reset result:",
      error ? "Error occurred" : "Success"
    );
    return { error };
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    console.log("AuthProvider: Starting profile update process...");
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update(data)
        .eq("id", user.id);
      if (error) throw error;
      console.log("AuthProvider: Profile update successful");
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    } finally {
      console.log(
        "AuthProvider: Profile update process complete, setting loading to false"
      );
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    isUsingFallbackProfile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    clearSession,
  };

  console.log("AuthProvider: Current state:", {
    hasUser: !!user,
    hasProfile: !!profile,
    loading,
    isUsingFallbackProfile,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
