import { supabase } from "./client";
import type { Database } from "../types/database.types";

// We use these types for function parameters and returns
type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];

// Get all budgets for a user
export const getBudgets = async (userId: string) => {
  const { data, error } = await supabase
    .from("budgets")
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
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data;
};

// Get a specific budget
export const getBudget = async (budgetId: string) => {
  const { data, error } = await supabase
    .from("budgets")
    .select(
      `
      *,
      categories (
        name,
        color
      )
    `
    )
    .eq("id", budgetId)
    .single();

  if (error) throw error;
  return data;
};

// Create a new budget
export const createBudget = async (budget: BudgetInsert) => {
  const { data, error } = await supabase
    .from("budgets")
    .insert(budget)
    .select();

  if (error) throw error;
  return data[0];
};

// Update a budget
export const updateBudget = async (id: string, updates: BudgetUpdate) => {
  const { data, error } = await supabase
    .from("budgets")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
};

// Delete a budget
export const deleteBudget = async (id: string) => {
  const { error } = await supabase.from("budgets").delete().eq("id", id);

  if (error) throw error;
  return true;
};

// Calculate budget progress
export const calculateBudgetProgress = async (
  userId: string,
  budgetId: string
) => {
  // First get the budget details
  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", budgetId)
    .single();

  if (budgetError) throw budgetError;

  // Then get all expenses within the budget period and category
  let query = supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "EXPENSE")
    .gte("date", budget.start_date)
    .lte("date", budget.end_date);

  // If the budget is for a specific category, filter by that category
  if (budget.category_id) {
    query = query.eq("category_id", budget.category_id);
  }

  const { data: expenses, error: expensesError } = await query;

  if (expensesError) throw expensesError;

  // Calculate the total spent
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    budget,
    totalSpent,
    remaining: budget.amount - totalSpent,
    percentUsed: (totalSpent / budget.amount) * 100,
  };
};
