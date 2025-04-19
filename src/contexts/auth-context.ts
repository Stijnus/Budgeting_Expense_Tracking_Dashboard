import { createContext } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export interface SignUpOptions {
  data?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    options?: SignUpOptions
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
