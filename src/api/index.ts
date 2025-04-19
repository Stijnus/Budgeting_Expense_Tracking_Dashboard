import { supabase } from "./supabase/client";
import type { Database } from "./types/database.types";

type Tables = Database["public"]["Tables"];
type Category = Tables["categories"]["Row"];
type Budget = Tables["budgets"]["Row"];
type Transaction = Tables["transactions"]["Row"];
type UserSettings = Tables["user_settings"]["Row"];

// Categories API
export const categoriesApi = {
  async list() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw error;
    return data;
  },

  async create(category: Omit<Category, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("categories")
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, category: Partial<Category>) {
    const { data, error } = await supabase
      .from("categories")
      .update(category)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

// Budgets API
export const budgetsApi = {
  async list(filters?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase.from("budgets").select("*, categories(*)");

    if (filters?.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters?.startDate) {
      query = query.gte("start_date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("end_date", filters.endDate);
    }

    const { data, error } = await query.order("start_date");
    if (error) throw error;
    return data;
  },

  async create(budget: Omit<Budget, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("budgets")
      .insert(budget)
      .select("*, categories(*)")
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, budget: Partial<Budget>) {
    const { data, error } = await supabase
      .from("budgets")
      .update(budget)
      .eq("id", id)
      .select("*, categories(*)")
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw error;
  },
};

// Transactions API
export const transactionsApi = {
  async list(filters?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    type?: "EXPENSE" | "INCOME";
  }) {
    let query = supabase.from("transactions").select("*, categories(*)");

    if (filters?.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters?.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate);
    }
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }

    const { data, error } = await query.order("date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(
    transaction: Omit<Transaction, "id" | "created_at" | "updated_at">
  ) {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transaction)
      .select("*, categories(*)")
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, transaction: Partial<Transaction>) {
    const { data, error } = await supabase
      .from("transactions")
      .update(transaction)
      .eq("id", id)
      .select("*, categories(*)")
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
  },
};

// User Settings API
export const userSettingsApi = {
  async get() {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .single();
    if (error && error.code !== "PGRST116") throw error; // Ignore not found error
    return data;
  },

  async upsert(settings: Omit<UserSettings, "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(settings)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
