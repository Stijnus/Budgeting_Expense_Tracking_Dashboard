import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { applyTheme } from "../utils/theme";
import { Database } from "../types/supabase";

type Theme = Database["public"]["Tables"]["user_settings"]["Row"]["theme"];
type Currency =
  Database["public"]["Tables"]["user_settings"]["Row"]["currency"];
type NotificationSettings =
  Database["public"]["Tables"]["user_settings"]["Row"]["notifications"];

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  notifications: NotificationSettings;
  setNotificationSetting: (
    key: keyof NotificationSettings,
    value: boolean
  ) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    budgetAlerts: true,
    monthlyReports: false,
    billReminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Custom theme setter that also applies the theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // Load settings from Supabase on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings to Supabase whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveSettings();
    }
  }, [theme, currency, notifications]);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const loadSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows returned, which is fine for new users
        throw error;
      }

      if (data) {
        setThemeState(data.theme);
        setCurrency(data.currency);
        setNotifications(data.notifications);
      } else {
        // If no settings exist, create default settings
        const defaultSettings = {
          user_id: user.id,
          theme: theme,
          currency: currency,
          notifications: notifications,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from("user_settings")
          .insert([defaultSettings])
          .single();

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          theme,
          currency,
          notifications,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      );

      if (error) throw error;
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const setNotificationSetting = (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        currency,
        setCurrency,
        notifications,
        setNotificationSetting,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
