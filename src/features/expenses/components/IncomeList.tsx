// src/features/expenses/components/IncomeList.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/supabase/client";
import type { Database } from "../../../api/types/database.types";
import {
  Loader2,
  AlertTriangle,
  Trash2,
  Pencil,
  DollarSign,
} from "lucide-react";
// We might need an EditIncomeModal later, similar to EditExpenseModal

type Income = Database["public"]["Tables"]["transactions"]["Row"];

interface IncomeListProps {
  // Add props if needed, e.g., refetch trigger from parent
  triggerRefetch?: number; // Simple way to trigger refetch by changing prop value
}

// Helper to format currency
const formatCurrency = (value: number): string => {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

export default function IncomeList({ triggerRefetch }: IncomeListProps) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Add state for editing later if needed
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const fetchIncomes = useCallback(async () => {
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

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "INCOME")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setIncomes(data || []);
    } catch (err: any) {
      console.error("Error fetching income:", err);
      setError(`Failed to load income: ${err.message}`);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes, triggerRefetch]); // Refetch when triggerRefetch changes

  const handleDelete = async (incomeId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this income record?")
    ) {
      return;
    }
    setDeletingId(incomeId);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", incomeId);
      if (deleteError) throw deleteError;
      // Refetch list after delete
      fetchIncomes();
    } catch (error: any) {
      console.error("Error deleting income:", error);
      setError(`Failed to delete income: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Placeholder for edit functionality
  const handleEditClick = (income: Income) => {
    alert(
      `Edit functionality for income ID: ${income.id} not implemented yet.`
    );
    // setEditingIncome(income);
    // setIsEditModalOpen(true);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <DollarSign size={20} className="text-green-600" /> Recent Income
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="min-h-[150px]">
        {" "}
        {/* Min height for loading/empty states */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin h-6 w-6 mr-3" /> Loading income...
          </div>
        ) : incomes.length === 0 ? (
          <div className="text-center py-6 px-4 text-gray-500">
            <DollarSign className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm">No income recorded yet.</p>
            <p className="text-xs">
              Use the form above to add your first income entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomes.map((income) => (
                  <tr
                    key={income.id}
                    className={`hover:bg-gray-50 ${
                      deletingId === income.id ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(income.date).toLocaleDateString()}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate"
                      title={income.description || ""}
                    >
                      {income.description || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 text-right font-medium">
                      {formatCurrency(income.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditClick(income)}
                        disabled={deletingId === income.id || loading} // Disable edit while deleting or loading
                        className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        title="Edit Income (Not Implemented)"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        disabled={deletingId === income.id || loading} // Disable delete while deleting or loading
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                        title="Delete Income"
                      >
                        {deletingId === income.id ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add EditIncomeModal here later if needed */}
      {/* <EditIncomeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={fetchIncomes} income={editingIncome} /> */}
    </div>
  );
}
