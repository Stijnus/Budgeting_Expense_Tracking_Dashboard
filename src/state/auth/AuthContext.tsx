import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../../api/supabase/client";
import { getUserProfile } from "../../api/supabase/auth";
import { AuthContext, type UserProfile } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log(
          "AuthProvider: Got session:",
          session ? "Session exists" : "No session",
          "Local storage session:",
          hasLocalStorageSession ? "Exists" : "None"
        );

        // Handle potential stale session
        if (sessionError || (hasLocalStorageSession && !session)) {
          console.log("AuthProvider: Detected stale session, clearing...");
          clearSession();
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          console.log("AuthProvider: Fetching user profile...");
          try {
            let userProfile = await getUserProfile(session.user.id);
            if (!userProfile) {
              console.log(
                "AuthProvider: No profile found, creating new profile..."
              );
              userProfile = await createProfile(session.user);
            }
            console.log(
              "AuthProvider: Got user profile:",
              userProfile ? "Profile exists" : "No profile"
            );
            setProfile(userProfile);
          } catch (profileError) {
            console.error(
              "AuthProvider: Error fetching initial profile:",
              profileError
            );
            // If we can't get the profile, the session might be invalid
            clearSession();
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

      // Handle token refresh errors
      if (event === "TOKEN_REFRESHED" && !session) {
        console.log("AuthProvider: Token refresh failed, clearing session...");
        clearSession();
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        try {
          console.log(
            "AuthProvider: Fetching user profile after auth change..."
          );
          const profile = await getUserProfile(session.user.id);
          console.log(
            "AuthProvider: Got user profile after auth change:",
            profile ? "Profile exists" : "No profile"
          );
          setProfile(profile);
        } catch (error) {
          console.error("AuthProvider: Error fetching user profile:", error);
          // Don't clear session on profile fetch error, just set profile to null
          setProfile(null);
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
          const userProfile = await getUserProfile(data.user.id);
          console.log(
            "AuthProvider: Profile fetch result:",
            userProfile ? "Success" : "No profile found"
          );
          if (!userProfile) {
            console.log("AuthProvider: Creating new profile...");
            try {
              const newProfile = await createProfile(data.user);
              setProfile(newProfile);
            } catch (createError) {
              console.error(
                "AuthProvider: Error creating profile:",
                createError
              );
              // Don't block sign in on profile creation error
              setProfile(null);
            }
          } else {
            setProfile(userProfile);
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
    // Clear storage
    localStorage.removeItem("supabase.auth.token");
    sessionStorage.removeItem("supabase.auth.token");
    // Remove any other auth-related items
    const authKeys = Object.keys(localStorage).filter(
      (key) => key.startsWith("supabase.auth.") || key.includes("token")
    );
    authKeys.forEach((key) => localStorage.removeItem(key));

    const sessionKeys = Object.keys(sessionStorage).filter(
      (key) => key.startsWith("supabase.auth.") || key.includes("token")
    );
    sessionKeys.forEach((key) => sessionStorage.removeItem(key));

    console.log("AuthProvider: Session state cleared");
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
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
