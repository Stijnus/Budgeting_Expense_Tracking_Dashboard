// src/components/ExpenseList.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'
import { Trash2, Pencil, Loader2, FilterX, ArrowUpDown } from 'lucide-react'; // Added icons
import EditExpenseModal from './EditExpenseModal';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  categories: { name: string } | null
}
type Category = Database['public']['Tables']['categories']['Row'];
type SortColumn = 'expense_date' | 'amount' | 'description' | 'categories';
type SortDirection = 'asc' | 'desc';

interface ExpenseListProps {
  setRefetch?: (refetchFn: () => void) => void;
  onExpenseUpdated: () => void; // Callback for when an expense is updated (via modal or delete)
}

export default function ExpenseList({ setRefetch, onExpenseUpdated }: ExpenseListProps) {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([]) // For filter dropdown
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filtering State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string | ''>('');

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('expense_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchExpensesAndCategories = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
        setLoading(true); // Only show full loading state on initial load
    } else {
        // Maybe show a subtle loading indicator near the table/filters?
        // For now, we rely on the disabled state of buttons.
    }
    setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.user) throw sessionError || new Error('User not logged in')
      const userId = session.user.id;

      // Fetch categories only once on initial load or if needed again
      if (isInitialLoad || categories.length === 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
      }

      // Build query with filters and sorting
      let query = supabase
        .from('expenses')
        .select(`*, categories ( name )`)
        .eq('user_id', userId);

      // Apply filters
      if (filterStartDate) {
        query = query.gte('expense_date', filterStartDate);
      }
      if (filterEndDate) {
        // Add 1 day to end date to include the whole day
        const endDatePlusOne = new Date(filterEndDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query = query.lte('expense_date', endDatePlusOne.toISOString().split('T')[0]);
      }
      if (filterCategoryId) {
        query = query.eq('category_id', filterCategoryId);
      }

      // Apply sorting
      // Note: Sorting by related table column ('categories.name') requires a view or function usually.
      // We'll sort basic columns for now. Sorting by category name client-side might be an option
      // for smaller datasets, but server-side is preferred. Let's sort by 'expense_date' or 'amount'.
      let effectiveSortColumn = sortColumn;
      if (sortColumn === 'categories' || sortColumn === 'description') {
          // Fallback to date sort if trying to sort by text/relation directly in basic query
          console.warn(`Sorting by ${sortColumn} might not be optimal with this query. Falling back to date.`);
          effectiveSortColumn = 'expense_date';
      }

      query = query.order(effectiveSortColumn, { ascending: sortDirection === 'asc' });
      // Add secondary sort for consistency
      if (effectiveSortColumn !== 'created_at') {
        query = query.order('created_at', { ascending: false });
      }


      const { data: expensesData, error: expensesError } = await query;

      if (expensesError) throw expensesError;

      setExpenses(expensesData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(`Failed to load expenses: ${error.message}`)
      setExpenses([]); // Clear expenses on error
    } finally {
      setLoading(false) // Ensure loading is false after fetch/refetch
    }
  }, [filterStartDate, filterEndDate, filterCategoryId, sortColumn, sortDirection, categories.length]) // Add dependencies

  // Initial fetch and refetch setup
  useEffect(() => {
    fetchExpensesAndCategories(true); // Pass true for initial load
    if (setRefetch) {
      setRefetch(() => () => fetchExpensesAndCategories(false)); // Pass false for subsequent refetches
    }
  }, [fetchExpensesAndCategories, setRefetch]) // fetchExpensesAndCategories is the key dependency here

  // Trigger refetch when filters or sorting change
  useEffect(() => {
    // No need to call fetchExpensesAndCategories here directly,
    // as it's already a dependency of the main useEffect hook.
    // The main hook will re-run when filter/sort state changes because
    // fetchExpensesAndCategories itself depends on them.
  }, [filterStartDate, filterEndDate, filterCategoryId, sortColumn, sortDirection]);


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
    onExpenseUpdated(); // Trigger refetch everywhere needed
    // Modal closes itself after a delay on successful save
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending for date/amount, ascending for text
      setSortColumn(column);
      setSortDirection(['expense_date', 'amount'].includes(column) ? 'desc' : 'asc');
    }
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCategoryId('');
    setSortColumn('expense_date'); // Reset sort
    setSortDirection('desc');
    // The useEffect watching these state variables will trigger the refetch
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-400 inline-block" />;
    }
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  return (
    <>
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Expenses</h2>

        {/* Filter and Sort Controls */}
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            {/* Date Range */}
            <div>
              <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                id="filterStartDate"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                id="filterEndDate"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                min={filterStartDate} // Prevent end date before start date
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={loading}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="filterCategory"
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={loading || categories.length === 0}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-1"> {/* Aligns button better */}
              <button
                onClick={clearFilters}
                disabled={loading}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1"
                title="Clear all filters and sorting"
              >
                <FilterX size={16} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                {error}
            </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin h-8 w-8 mr-3" />
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          // Empty State
          <div className="text-center py-10 px-4">
             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
             <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
             <p className="mt-1 text-sm text-gray-500">
                {filterStartDate || filterEndDate || filterCategoryId
                    ? "Try adjusting your filters or add a new expense."
                    : "Get started by adding your first expense!"}
             </p>
             {/* Optionally add a button to add expense or clear filters */}
             {(filterStartDate || filterEndDate || filterCategoryId) && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <FilterX size={16} className="-ml-1 mr-2 h-5 w-5" />
                        Clear Filters
                    </button>
                </div>
             )}
          </div>
        ) : (
          // Expense Table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('expense_date')}>
                    Date {renderSortIcon('expense_date')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('description')}>
                    Description {renderSortIcon('description')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('categories')}>
                    Category {renderSortIcon('categories')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                    Amount {renderSortIcon('amount')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className={`hover:bg-gray-50 ${deletingId === expense.id ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(expense.expense_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={expense.description || ''}>{expense.description || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{expense.categories?.name || <span className="italic text-gray-400">Uncategorized</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${typeof expense.amount === 'number' ? expense.amount.toFixed(2) : expense.amount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditClick(expense)}
                        disabled={deletingId === expense.id || isEditModalOpen || loading}
                        className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        title="Edit Expense"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id || isEditModalOpen || loading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                        title="Delete Expense"
                      >
                        {deletingId === expense.id ? (
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

      {/* Edit Modal */}
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveExpense}
        expense={editingExpense}
        categories={categories} // Pass fetched categories to modal
      />
    </>
  )
}
