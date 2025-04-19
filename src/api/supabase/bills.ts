import { supabase } from "./client";
import type { Database } from "../types/database.types";

// We use these types for function parameters and returns
type BillSubscriptionInsert = Database["public"]["Tables"]["bills_subscriptions"]["Insert"];
type BillSubscriptionUpdate = Database["public"]["Tables"]["bills_subscriptions"]["Update"];
type BillSubscription = Database["public"]["Tables"]["bills_subscriptions"]["Row"];

// Get all bills and subscriptions for a user
export const getBillsSubscriptions = async (userId: string) => {
  const { data, error } = await supabase
    .from("bills_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data;
};

// Get upcoming bills and subscriptions for a user
export const getUpcomingBillsSubscriptions = async (userId: string, daysAhead = 30) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);
  
  const { data, error } = await supabase
    .from("bills_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_paid", false)
    .gte("due_date", today.toISOString().split('T')[0])
    .lte("due_date", futureDate.toISOString().split('T')[0])
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data;
};

// Add a new bill or subscription
export const addBillSubscription = async (billSubscription: BillSubscriptionInsert) => {
  const { data, error } = await supabase
    .from("bills_subscriptions")
    .insert(billSubscription)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a bill or subscription
export const updateBillSubscription = async (id: string, updates: BillSubscriptionUpdate) => {
  const { data, error } = await supabase
    .from("bills_subscriptions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a bill or subscription
export const deleteBillSubscription = async (id: string) => {
  const { error } = await supabase
    .from("bills_subscriptions")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
};

// Mark a bill as paid
export const markBillAsPaid = async (id: string, isPaid = true) => {
  const { data, error } = await supabase
    .from("bills_subscriptions")
    .update({ is_paid: isPaid })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
