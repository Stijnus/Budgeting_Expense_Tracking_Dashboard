// src/components/ExpenseList.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'
import { Trash2, Pencil } from 'lucide-react';
import EditExpenseModal from './EditExpenseModal';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  categories: { name: string } | null
}
type Category = Database['public']['Tables']['categories']['Row'];

interface ExpenseListProps {
  setRefetch?: (refetchFn: () => void) => void;
  onExpenseUpdated: () => void; // Callback for when an expense is updated (via modal)
}

export default function ExpenseList({ setRefetch, onExpenseUpdated }: ExpenseListProps) {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const fetchExpensesAndCategories = useCallback(async () => {
    // Only set loading true on initial fetch, not refetches
    // setLoading(true);
    setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.user) throw sessionError || new Error('User not logged in')
      const userId = session.user.id;

      const [expensesResult, categoriesResult] = await Promise.all([
        supabase
          .from('expenses')
          .select(`*, categories ( name )`)
          .eq('user_id', userId)
          .order('expense_date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true })
      ]);

      if (expensesResult.error) throw expensesResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setExpenses(expensesResult.data || []);
      setCategories(categoriesResult.data || []);

    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(`Failed to load data: ${error.message}`)
    } finally {
      setLoading(false) // Ensure loading is false after fetch/refetch
    }
  }, [])

  useEffect(() => {
    setLoading(true); // Set loading true only on initial mount
    fetchExpensesAndCategories()
    if (setRefetch) {
      setRefetch(() => fetchExpensesAndCategories);
    }
  }, [fetchExpensesAndCategories, setRefetch])

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    setDeletingId(expenseId);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      if (deleteError) throw deleteError;
      // await fetchExpensesAndCategories(); // Refetch list
      onExpenseUpdated(); // Use the callback to trigger refetch in App -> List & Charts
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      setError(`Failed to delete expense: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

  const handleSaveExpense = () => {
    // Use the callback passed from App.tsx to trigger refetch everywhere needed
    onExpenseUpdated();
    // Modal closes itself after a delay on successful save
  };


  return (
    <>
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Expenses</h2>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-gray-500">No expenses recorded yet. Add one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className={deletingId === expense.id ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(expense.expense_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{expense.description || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{expense.categories?.name || 'Uncategorized'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${typeof expense.amount === 'number' ? expense.amount.toFixed(2) : expense.amount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditClick(expense)}
                        disabled={deletingId === expense.id || isEditModalOpen}
                        className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-indigo-100"
                        title="Edit Expense"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id || isEditModalOpen}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-red-100"
                        title="Delete Expense"
                      >
                        {deletingId === expense.id ? (
                          <span className="text-xs">...</span>
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

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveExpense} // Pass the correct handler
        expense={editingExpense}
        categories={categories}
      />
    </>
  )
}
