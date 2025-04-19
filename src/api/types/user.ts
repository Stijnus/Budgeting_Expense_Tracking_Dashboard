export type UserRole = "user" | "admin" | "superuser";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate
  extends Partial<
    Omit<UserProfile, "id" | "created_at" | "updated_at" | "role">
  > {
  id?: never;
  created_at?: never;
  updated_at?: never;
  role?: never;
}

export interface UserWithProfile {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  description?: string;
  members?: HouseholdMember[];
}
