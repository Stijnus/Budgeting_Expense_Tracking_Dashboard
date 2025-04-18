export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: "light" | "dark";
          currency: "EUR" | "USD" | "GBP";
          notifications: {
            budgetAlerts: boolean;
            monthlyReports: boolean;
            billReminders: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: "light" | "dark";
          currency?: "EUR" | "USD" | "GBP";
          notifications?: {
            budgetAlerts: boolean;
            monthlyReports: boolean;
            billReminders: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: "light" | "dark";
          currency?: "EUR" | "USD" | "GBP";
          notifications?: {
            budgetAlerts: boolean;
            monthlyReports: boolean;
            billReminders: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other table definitions here as needed
    };
  };
}
