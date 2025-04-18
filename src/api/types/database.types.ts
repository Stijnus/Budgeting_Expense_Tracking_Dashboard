export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          end_date: string;
          id: string;
          start_date: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          end_date: string;
          id?: string;
          start_date: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          end_date?: string;
          id?: string;
          start_date?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          color: string;
          created_at: string | null;
          icon: string | null;
          id: string;
          name: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          color: string;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          color?: string;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          date: string;
          description: string | null;
          id: string;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          date?: string;
          description?: string | null;
          id?: string;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          date?: string;
          description?: string | null;
          id?: string;
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          phone_number: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          phone_number?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          phone_number?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string | null;
          default_currency: Database["public"]["Enums"]["currency_code"];
          notification_enabled: boolean | null;
          theme: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          default_currency?: Database["public"]["Enums"]["currency_code"];
          notification_enabled?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          default_currency?: Database["public"]["Enums"]["currency_code"];
          notification_enabled?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      expense_tags: {
        Row: {
          expense_id: string;
          tag_id: string;
        };
        Insert: {
          expense_id: string;
          tag_id: string;
        };
        Update: {
          expense_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_tags_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
      transaction_tags: {
        Row: {
          transaction_id: string;
          tag_id: string;
        };
        Insert: {
          transaction_id: string;
          tag_id: string;
        };
        Update: {
          transaction_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
      bills_subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          amount: number;
          currency: Database["public"]["Enums"]["currency_code"];
          due_date: string;
          frequency: string;
          notes: string | null;
          is_paid: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          amount: number;
          currency?: Database["public"]["Enums"]["currency_code"];
          due_date: string;
          frequency: string;
          notes?: string | null;
          is_paid?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          amount?: number;
          currency?: Database["public"]["Enums"]["currency_code"];
          due_date?: string;
          frequency?: string;
          notes?: string | null;
          is_paid?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bills_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      financial_goals: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          target_amount: number;
          current_amount: number;
          currency: Database["public"]["Enums"]["currency_code"];
          target_date: string | null;
          description: string | null;
          is_completed: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          target_amount: number;
          current_amount?: number;
          currency?: Database["public"]["Enums"]["currency_code"];
          target_date?: string | null;
          description?: string | null;
          is_completed?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          currency?: Database["public"]["Enums"]["currency_code"];
          target_date?: string | null;
          description?: string | null;
          is_completed?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "financial_goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_user: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      currency_code: "USD" | "EUR" | "GBP";
      transaction_type: "EXPENSE" | "INCOME";
      user_role: "user" | "admin" | "superuser";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      currency_code: ["USD", "EUR", "GBP"],
      transaction_type: ["EXPENSE", "INCOME"],
      user_role: ["user", "admin", "superuser"],
    },
  },
} as const;
