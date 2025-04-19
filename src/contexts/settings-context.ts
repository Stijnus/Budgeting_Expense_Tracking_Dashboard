import { createContext } from "react";
import type { Database } from "../lib/database.types";

export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);
