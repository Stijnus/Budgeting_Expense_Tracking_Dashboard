// src/components/ExpenseList.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'
import { Trash2, Pencil, Loader2, FilterX, ArrowUpDown, Search, X } from 'lucide-react'; // Added Search, X icons
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

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}


export default function ExpenseList({ setRefetch, onExpenseUpdated }: ExpenseListProps) {
  const [loading, setLoading] = useState(true) // Unified loading state
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
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search term by 300ms

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('expense_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const searchInputRef = useRef<HTMLInputElement>(null); // Ref for search input
  const isInitialLoadRef = useRef(true); // Ref to track initial load

  const fetchExpensesAndCategories = useCallback(async () => {
    // Set loading true only on the very first load triggered by useEffect mount
    if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false; // Mark initial load as complete after the first fetch starts
    } else {
        // For subsequent fetches (filters, sort, search, manual refresh),
        // we might want a different indicator or just rely on disabled controls.
        // Setting setLoading(true) here would show the full loader again.
        // Let's keep it simple for now and not show a loader on refetch.
    }
    setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.user) throw sessionError || new Error('User not logged in')
      const userId = session.user.id;

      // Fetch categories only if needed (e.g., first load or empty)
      // This check might be redundant if categories are fetched once and stored,
      // but kept for robustness if categories could change elsewhere.
      if (categories.length === 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
      }

      // Build query with filters, search, and sorting
      let query = supabase
        .from('expenses')
        .select(`*, categories ( name )`)
        .eq('user_id', userId);

      // Apply filters
      if (filterStartDate) {
        query = query.gte('expense_date', filterStartDate);
      }
      if (filterEndDate) {
        const endDatePlusOne = new Date(filterEndDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query = query.lte('expense_date', endDatePlusOne.toISOString().split('T')[0]);
      }
      if (filterCategoryId) {
        query = query.eq('category_id', filterCategoryId);
      }

      // Apply search (using debounced term)
      if (debouncedSearchTerm) {
        query = query.ilike('description', `%${debouncedSearchTerm}%`);
      }

      // Apply sorting
      let effectiveSortColumn = sortColumn;
      if (sortColumn === 'categories') {
          console.warn(`Sorting by category name might not be optimal with this query. Falling back to date.`);
          effectiveSortColumn = 'expense_date';
      } else if (sortColumn === 'description') {
          effectiveSortColumn = 'description';
      }
      // else it's 'expense_date' or 'amount' which are fine

      query = query.order(effectiveSortColumn, { ascending: sortDirection === 'asc' });
      if (effectiveSortColumn !== 'created_at') {
        query = query.order('created_at', { ascending: false }); // Secondary sort
      }


      const { data: expensesData, error: expensesError } = await query;

      if (expensesError) throw expensesError;

      setExpenses(expensesData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(`Failed to load expenses: ${error.message}`)
      setExpenses([]);
    } finally {
      // Always set loading false when fetch completes or fails
      // This handles both initial load and subsequent updates.
      setLoading(false)
    }
  }, [filterStartDate, filterEndDate, filterCategoryId, debouncedSearchTerm, sortColumn, sortDirection, categories.length]) // Dependencies for the fetch logic

  // Initial fetch on mount
  useEffect(() => {
    fetchExpensesAndCategories(); // Trigger initial fetch
  }, []); // Empty dependency array ensures this runs only once on mount

  // Refetch when filters/sort/search change (debounced search)
  useEffect(() => {
    // Skip the very first render cycle (handled by mount useEffect)
    if (!isInitialLoadRef.current) {
      // Set loading true here to show loader during filter/sort/search updates
      setLoading(true);
      fetchExpensesAndCategories();
    }
  }, [debouncedSearchTerm, filterStartDate, filterEndDate, filterCategoryId, sortColumn, sortDirection, fetchExpensesAndCategories]); // Include fetchExpensesAndCategories

  // Setup refetch function for parent component
  useEffect(() => {
    if (setRefetch) {
      // Provide a function that sets loading true before fetching
      setRefetch(() => () => {
          setLoading(true);
          fetchExpensesAndCategories();
      });
    }
    // Cleanup refetch function on unmount
    return () => {
        if (setRefetch) {
            setRefetch(() => () => {});
        }
    }
  }, [setRefetch, fetchExpensesAndCategories]);


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
      onExpenseUpdated(); // Trigger refetch via parent
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
    onExpenseUpdated(); // Trigger refetch via parent
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(['expense_date', 'amount'].includes(column) ? 'desc' : 'asc');
    }
    // State change will trigger the useEffect hook for refetching
  };

  const clearFiltersAndSearch = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCategoryId('');
    setSearchTerm(''); // Clear search term
    setSortColumn('expense_date'); // Reset sort
    setSortDirection('desc');
    searchInputRef.current?.focus(); // Focus search input after clearing
    // State changes will trigger the useEffect hook for refetching
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

        {/* Filter, Sort, and Search Controls */}
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
          {/* Row 1: Search and Clear */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
             <div className="relative flex-grow w-full">
                <label htmlFor="search" className="sr-only">Search Descriptions</label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                </div>
                <input
                    ref={searchInputRef}
                    type="search"
                    id="search"
                    placeholder="Search descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    disabled={loading} // Disable input while loading
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        title="Clear search"
                        disabled={loading} // Disable button while loading
                    >
                        <X size={16} />
                    </button>
                )}
             </div>
             <button
                onClick={clearFiltersAndSearch}
                disabled={loading} // Disable button while loading
                className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1 flex-shrink-0"
                title="Clear all filters and search"
              >
                <FilterX size={16} /> Clear All
              </button>
          </div>

          {/* Row 2: Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            {/* Date Range */}
            <div>
              <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                id="filterStartDate"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={loading} // Disable input while loading
              />
            </div>
            <div>
              <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                id="filterEndDate"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                min={filterStartDate || undefined}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={loading || !filterStartDate} // Also disable if start date isn't set
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
                disabled={loading || categories.length === 0} // Disable select while loading
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                {error}
            </div>
        )}

        {/* Loading State - Unified Loader */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin h-8 w-8 mr-3" />
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          // Empty State (shown only when not loading)
          <div className="text-center py-10 px-4">
             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> {/* Search icon */}
             </svg>
             <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
             <p className="mt-1 text-sm text-gray-500">
                {filterStartDate || filterEndDate || filterCategoryId || debouncedSearchTerm
                    ? "Try adjusting your search or filters."
                    : "Get started by adding your first expense!"}
             </p>
             {(filterStartDate || filterEndDate || filterCategoryId || debouncedSearchTerm) && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={clearFiltersAndSearch}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <FilterX size={16} className="-ml-1 mr-2 h-5 w-5" />
                        Clear Filters & Search
                    </button>
                </div>
             )}
          </div>
        ) : (
          // Expense Table (shown only when not loading and expenses exist)
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
