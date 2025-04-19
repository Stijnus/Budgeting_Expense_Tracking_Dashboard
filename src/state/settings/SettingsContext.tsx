import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../api/supabase/client";
import { useAuth } from "../auth/useAuth";
import {
  type SettingsContextType,
  type UserSettings,
} from "./settings-context";
import { SettingsContext } from "./settings-context";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setSettings(data);
      setError(null);
    } catch (err) {
      console.error("Error loading settings:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load settings")
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!user || !settings) {
        throw new Error("No user or settings found");
      }

      try {
        const { error } = await supabase
          .from("user_settings")
          .update(newSettings)
          .eq("user_id", user.id);

        if (error) throw error;

        setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
        setError(null);
      } catch (err) {
        console.error("Error saving settings:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to save settings")
        );
        throw err;
      }
    },
    [user, settings]
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    updateSettings: saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
