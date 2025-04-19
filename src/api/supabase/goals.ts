import { supabase } from "./client";
import type { Database } from "../types/database.types";

// We use these types for function parameters and returns
type FinancialGoalInsert = Database["public"]["Tables"]["financial_goals"]["Insert"];
type FinancialGoalUpdate = Database["public"]["Tables"]["financial_goals"]["Update"];
type FinancialGoal = Database["public"]["Tables"]["financial_goals"]["Row"];

// Get all financial goals for a user
export const getFinancialGoals = async (userId: string) => {
  const { data, error } = await supabase
    .from("financial_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get active (not completed) financial goals for a user
export const getActiveFinancialGoals = async (userId: string) => {
  const { data, error } = await supabase
    .from("financial_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .order("target_date", { ascending: true });

  if (error) throw error;
  return data;
};

// Add a new financial goal
export const addFinancialGoal = async (goal: FinancialGoalInsert) => {
  const { data, error } = await supabase
    .from("financial_goals")
    .insert(goal)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a financial goal
export const updateFinancialGoal = async (id: string, updates: FinancialGoalUpdate) => {
  const { data, error } = await supabase
    .from("financial_goals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a financial goal
export const deleteFinancialGoal = async (id: string) => {
  const { error } = await supabase
    .from("financial_goals")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
};

// Update the current amount of a goal
export const updateGoalProgress = async (id: string, amount: number) => {
  // First get the current goal to check if it's completed
  const { data: goal, error: fetchError } = await supabase
    .from("financial_goals")
    .select("*")
    .eq("id", id)
    .single();
    
  if (fetchError) throw fetchError;
  
  // Check if the goal will be completed with this update
  const isCompleted = amount >= goal.target_amount;
  
  // Update the goal
  const { data, error } = await supabase
    .from("financial_goals")
    .update({ 
      current_amount: amount,
      is_completed: isCompleted
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
