import { supabase } from "./client";
import type { Database } from "../types/database.types";

// We use these types for function parameters and returns
type ExpenseInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["transactions"]["Update"];

// Get all expenses for a user
export const getExpenses = async (userId: string) => {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      categories (
        name,
        color
      )
    `
    )
    .eq("user_id", userId)
    .eq("type", "EXPENSE")
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
};

// Get expenses with filters
export const getFilteredExpenses = async (
  userId: string,
  filters: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    searchTerm?: string;
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
  }
) => {
  let query = supabase
    .from("transactions")
    .select(
      `
      *,
      categories (
        name,
        color
      )
    `
    )
    .eq("user_id", userId)
    .eq("type", "EXPENSE");

  // Apply filters
  if (filters.startDate) query = query.gte("date", filters.startDate);
  if (filters.endDate) query = query.lte("date", filters.endDate);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.searchTerm)
    query = query.ilike("description", `%${filters.searchTerm}%`);

  // Apply sorting
  const sortColumn = filters.sortColumn || "date";
  const sortDirection = filters.sortDirection || "desc";
  query = query.order(sortColumn, { ascending: sortDirection === "asc" });

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Create a new expense
export const createExpense = async (expense: ExpenseInsert) => {
  const { data, error } = await supabase
    .from("transactions")
    .insert(expense)
    .select();

  if (error) throw error;
  return data[0];
};

// Update an expense
export const updateExpense = async (id: string, updates: ExpenseUpdate) => {
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
};

// Delete an expense
export const deleteExpense = async (id: string) => {
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) throw error;
  return true;
};
