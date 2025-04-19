// src/features/budgets/components/BudgetManager.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/supabase/client";
import type { Database } from "../../../api/types/database.types";
import {
  Loader2,
  AlertTriangle,
  Trash2,
  Pencil,
  Save,
  PlusCircle,
  Target,
} from "lucide-react";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

// Extend Budget type locally to include calculated spent amount and category name
type BudgetWithDetails = Budget & {
  spent: number;
  category_name: string | null; // Add category name fetched via join
};

// Helper to get the first and last day of the current month in YYYY-MM-DD format
const getCurrentMonthDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: firstDay.toISOString().split("T")[0],
    end: lastDay.toISOString().split("T")[0],
  };
};

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<BudgetWithDetails[]>([]); // Use extended type
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<BudgetWithDetails | null>(
    null
  ); // Use extended type
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "">("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(getCurrentMonthDates().start);
  const [endDate, setEndDate] = useState(getCurrentMonthDates().end);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch budgets, categories, and relevant expenses
  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user)
        throw sessionError || new Error("User not logged in");
      const userId = session.user.id;

      // 1. Fetch Categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", userId)
        .order("name", { ascending: true });
      if (categoriesError) throw categoriesError;
      const fetchedCategories = categoriesData || [];
      setCategories(fetchedCategories);

      // 2. Fetch Budgets with category names
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select(`*, categories ( name )`) // Join to get category name
        .eq("user_id", userId)
        .order("start_date", { ascending: false })
        .order("category_id", { ascending: true, nullsFirst: true });
      if (budgetsError) throw budgetsError;
      const fetchedBudgets = budgetsData || [];

      if (fetchedBudgets.length === 0) {
        setBudgets([]); // No budgets, no need to fetch expenses
        return;
      }

      // 3. Determine overall date range needed for expenses
      const minStartDate = fetchedBudgets.reduce(
        (min, b) => (b.start_date < min ? b.start_date : min),
        fetchedBudgets[0].start_date
      );
      const maxEndDate = fetchedBudgets.reduce(
        (max, b) => (b.end_date > max ? b.end_date : max),
        fetchedBudgets[0].end_date
      );

      // 4. Fetch relevant Expenses within the date range
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("amount, expense_date, category_id")
        .eq("user_id", userId)
        .gte("expense_date", minStartDate)
        .lte("expense_date", maxEndDate);
      if (expensesError) throw expensesError;
      const relevantExpenses = expensesData || [];

      // 5. Calculate spent amount for each budget
      const budgetsWithDetails = fetchedBudgets.map((budget) => {
        const spent = relevantExpenses
          .filter((expense) => {
            const expenseDate = new Date(expense.expense_date);
            const startDate = new Date(budget.start_date);
            const endDate = new Date(budget.end_date);
            // Ensure dates are compared correctly (inclusive)
            const isWithinDateRange =
              expenseDate >= startDate && expenseDate <= endDate;
            const isMatchingCategory =
              budget.category_id === null ||
              budget.category_id === expense.category_id;
            return isWithinDateRange && isMatchingCategory;
          })
          .reduce((sum, expense) => sum + expense.amount, 0);

        return {
          ...budget,
          spent: parseFloat(spent.toFixed(2)), // Ensure 2 decimal places
          // Use type assertion for joined data
          category_name:
            (budget as { categories?: { name: string } }).categories?.name ||
            null,
        };
      });

      setBudgets(budgetsWithDetails);
    } catch (err) {
      console.error("Error fetching budget data:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load budget data: ${errorMessage}`);
      setBudgets([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgetData(); // Use the combined fetch function
  }, [fetchBudgetData]);

  const resetForm = () => {
    setIsEditing(false);
    setCurrentBudget(null);
    setSelectedCategoryId("");
    setAmount("");
    const currentMonth = getCurrentMonthDates();
    setStartDate(currentMonth.start);
    setEndDate(currentMonth.end);
    setFormError(null);
    setIsSubmitting(false);
  };

  const handleEditClick = (budget: BudgetWithDetails) => {
    setIsEditing(true);
    setCurrentBudget(budget);
    setSelectedCategoryId(budget.category_id || "");
    setAmount(String(budget.amount));
    setStartDate(budget.start_date);
    setEndDate(budget.end_date);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (budgetId: string) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const { error: deleteError } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId);

      if (deleteError) throw deleteError;

      // Refetch data to update list and potentially progress calculations
      fetchBudgetData();
      if (currentBudget?.id === budgetId) {
        resetForm();
      }
    } catch (err) {
      console.error("Error deleting budget:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setFormError(`Failed to delete budget: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid positive amount.");
      return;
    }
    if (!startDate || !endDate) {
      setFormError("Please select both a start and end date.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError("Start date cannot be after end date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("User not found");

      const budgetData = {
        user_id: user.id,
        category_id: selectedCategoryId || null,
        amount: parsedAmount,
        start_date: startDate,
        end_date: endDate,
      };

      if (isEditing && currentBudget) {
        // Update existing budget
        const { error: updateError } = await supabase
          .from("budgets")
          .update(budgetData)
          .eq("id", currentBudget.id);
        if (updateError) throw updateError;
      } else {
        // Insert new budget
        const { error: insertError } = await supabase
          .from("budgets")
          .insert(budgetData);
        if (insertError) {
          if (insertError.code === "23505") {
            throw new Error(
              "A budget for this category/period already exists."
            );
          }
          throw insertError;
        }
      }

      resetForm();
      fetchBudgetData(); // Refetch all data after save to update list and progress
    } catch (err) {
      console.error("Error saving budget:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setFormError(`Failed to save budget: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return "Overall Budget";
    return (
      categories.find((c) => c.id === categoryId)?.name || "Unknown Category"
    );
  };

  // Helper to format currency
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  // Calculate remaining amount and percentage
  const calculateProgress = (budget: BudgetWithDetails) => {
    const remaining = budget.amount - budget.spent;
    const percentage =
      budget.amount > 0
        ? Math.min(100, (budget.spent / budget.amount) * 100)
        : 0; // Cap at 100%
    const isOverBudget = budget.spent > budget.amount;
    return { remaining, percentage, isOverBudget };
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {isEditing ? "Edit Budget" : "Add New Budget"}
      </h2>

      {/* Add/Edit Budget Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4"
      >
        {/* Category Selection */}
        <div>
          <label
            htmlFor="budget-category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="budget-category"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
            disabled={isSubmitting || loading}
          >
            <option value="">-- Overall Budget --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && !loading && (
            <p className="mt-1 text-xs text-gray-500">
              No categories found. Add categories first.
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="budget-amount"
            className="block text-sm font-medium text-gray-700"
          >
            Amount *
          </label>
          <input
            type="number"
            id="budget-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="budget-start-date"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date *
            </label>
            <input
              type="date"
              id="budget-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="budget-end-date"
              className="block text-sm font-medium text-gray-700"
            >
              End Date *
            </label>
            <input
              type="date"
              id="budget-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Form Error Display */}
        {formError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle size={16} /> {formError}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center min-w-[100px] ${
              isEditing
                ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : isEditing ? (
              <Save size={16} className="mr-2" />
            ) : (
              <PlusCircle size={16} className="mr-2" />
            )}
            {isSubmitting
              ? "Saving..."
              : isEditing
              ? "Update Budget"
              : "Add Budget"}
          </button>
        </div>
      </form>

      {/* Existing Budgets List */}
      <h3 className="text-lg font-semibold mb-3 text-gray-700 mt-6 pt-4 border-t">
        Existing Budgets
      </h3>
      <div className="min-h-[100px]">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-gray-500">
            <Loader2 className="animate-spin h-6 w-6 mr-3" /> Loading budgets...
          </div>
        ) : error ? (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-6 px-4 text-gray-500">
            <Target className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm">No budgets set yet.</p>
            <p className="text-xs">
              Use the form above to add your first budget goal.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {budgets.map((budget) => {
              const { remaining, percentage, isOverBudget } =
                calculateProgress(budget);
              const progressBarColor = isOverBudget
                ? "bg-red-500"
                : "bg-green-500";
              const remainingColor = isOverBudget
                ? "text-red-600 font-semibold"
                : "text-green-600";

              return (
                <li
                  key={budget.id}
                  className={`p-3 rounded-md border flex flex-col gap-2 ${
                    currentBudget?.id === budget.id
                      ? "bg-indigo-50 border-indigo-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {/* Top Row: Name, Amount, Dates, Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex-grow">
                      <span
                        className={`font-medium ${
                          budget.category_id
                            ? "text-gray-800"
                            : "text-indigo-700 font-semibold"
                        }`}
                      >
                        {getCategoryName(budget.category_id)}
                      </span>
                      <span className="block sm:inline sm:ml-2 text-gray-600 text-sm">
                        (Target: {formatCurrency(budget.amount)})
                      </span>
                      <span className="block text-xs text-gray-500 mt-1 sm:mt-0 sm:ml-2">
                        {new Date(budget.start_date).toLocaleDateString()} -{" "}
                        {new Date(budget.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleEditClick(budget)}
                        disabled={isSubmitting}
                        className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-400"
                        title="Edit Budget"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(budget.id)}
                        disabled={isSubmitting}
                        className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-red-400"
                        title="Delete Budget"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {/* Bottom Row: Progress Bar and Text */}
                  <div className="mt-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">
                        Spent: {formatCurrency(budget.spent)}
                      </span>
                      <span className={remainingColor}>
                        {isOverBudget
                          ? `${formatCurrency(Math.abs(remaining))} Over Budget`
                          : `${formatCurrency(remaining)} Remaining`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className={`h-2.5 rounded-full ${progressBarColor}`}
                        style={{ width: `${percentage}%` }}
                        title={`${percentage.toFixed(1)}% Spent`}
                      ></div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
