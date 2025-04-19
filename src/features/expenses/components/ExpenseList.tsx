// src/features/expenses/components/ExpenseList.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../../api/supabase/client'
import type { Database } from '../../../api/types/database.types'
import { Trash2, Pencil, Loader2, FilterX, ArrowUpDown, Search, X, Download } from 'lucide-react'; // Added Download icon
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
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// CSV Escape function
const escapeCsvValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) {
        return '';
    }
    const stringValue = String(value);
    // If the value contains a comma, newline, or double quote, enclose it in double quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        // Escape existing double quotes by doubling them
        const escapedValue = stringValue.replace(/"/g, '""');
        return `"${escapedValue}"`;
    }
    return stringValue;
};


export default function ExpenseList({ setRefetch, onExpenseUpdated }: ExpenseListProps) {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isExporting, setIsExporting] = useState(false); // State for export loading
  const [exportError, setExportError] = useState<string | null>(null); // State for export error

  // Filtering State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('expense_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadRef = useRef(true);

  const fetchExpensesAndCategories = useCallback(async () => {
    if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
    } else {
        // Optionally show a different loading indicator for refetches
    }
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw sessionError || new Error('User not logged in');
      const userId = session.user.id;

      if (categories.length === 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
      }

      let query = supabase
        .from('expenses')
        .select(`*, categories ( name )`)
        .eq('user_id', userId);

      // Apply filters
      if (filterStartDate) query = query.gte('expense_date', filterStartDate);
      if (filterEndDate) {
        const endDatePlusOne = new Date(filterEndDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query = query.lte('expense_date', endDatePlusOne.toISOString().split('T')[0]);
      }
      if (filterCategoryId) query = query.eq('category_id', filterCategoryId);
      if (debouncedSearchTerm) query = query.ilike('description', `%${debouncedSearchTerm}%`);

      // Apply sorting
      let effectiveSortColumn = sortColumn;
      if (sortColumn === 'categories') effectiveSortColumn = 'expense_date'; // Fallback category sort
      else if (sortColumn === 'description') effectiveSortColumn = 'description';

      query = query.order(effectiveSortColumn, { ascending: sortDirection === 'asc' });
      if (effectiveSortColumn !== 'created_at') query = query.order('created_at', { ascending: false });

      const { data: expensesData, error: expensesError } = await query;
      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(`Failed to load expenses: ${error.message}`);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterCategoryId, debouncedSearchTerm, sortColumn, sortDirection, categories.length]);

  // Initial fetch on mount
  useEffect(() => {
    fetchExpensesAndCategories();
  }, []); // Run once

  // Refetch when filters/sort/search change
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      setLoading(true); // Show loader for updates
      fetchExpensesAndCategories();
    }
  }, [debouncedSearchTerm, filterStartDate, filterEndDate, filterCategoryId, sortColumn, sortDirection, fetchExpensesAndCategories]);

  // Setup refetch function for parent
  useEffect(() => {
    if (setRefetch) {
      setRefetch(() => () => {
          setLoading(true);
          fetchExpensesAndCategories();
      });
    }
    return () => { if (setRefetch) setRefetch(() => () => {}); }
  }, [setRefetch, fetchExpensesAndCategories]);

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm('Are you sure?')) return;
    setDeletingId(expenseId); setError(null);
    try {
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (deleteError) throw deleteError;
      onExpenseUpdated();
    } catch (error: any) {
      setError(`Failed to delete expense: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense); setIsEditModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsEditModalOpen(false); setEditingExpense(null);
  };
  const handleSaveExpense = () => { onExpenseUpdated(); };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDirection(['expense_date', 'amount'].includes(column) ? 'desc' : 'asc'); }
  };

  const clearFiltersAndSearch = () => {
    setFilterStartDate(''); setFilterEndDate(''); setFilterCategoryId(''); setSearchTerm('');
    setSortColumn('expense_date'); setSortDirection('desc');
    searchInputRef.current?.focus();
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown size={14} className="ml-1 text-gray-400 inline-block" />;
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  // --- EXPORT FUNCTIONALITY ---
  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportError(null);
    console.log("Starting CSV export...");

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) throw sessionError || new Error('User not logged in');
        const userId = session.user.id;

        // Fetch ALL expenses for the user, including category name
        const { data: allExpenses, error: fetchError } = await supabase
            .from('expenses')
            .select(`
                expense_date,
                description,
                amount,
                categories ( name )
            `)
            .eq('user_id', userId)
            .order('expense_date', { ascending: false }); // Order by date descending for export

        if (fetchError) throw fetchError;

        if (!allExpenses || allExpenses.length === 0) {
            setExportError("No expenses found to export.");
            setIsExporting(false);
            return;
        }

        console.log(`Fetched ${allExpenses.length} expenses for export.`);

        // Define CSV Headers
        const headers = ['Date', 'Description', 'Category', 'Amount'];
        const csvRows = [headers.join(',')]; // Start with header row

        // Process data into CSV rows
        allExpenses.forEach(exp => {
            const row = [
                escapeCsvValue(exp.expense_date),
                escapeCsvValue(exp.description),
                escapeCsvValue((exp as any).categories?.name || 'Uncategorized'), // Access joined category name
                escapeCsvValue(exp.amount)
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');

        // Create Blob and trigger download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Check for browser support
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'expenses_export.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up
            console.log("CSV export successful.");
        } else {
            throw new Error("Browser does not support automatic download.");
        }

    } catch (error: any) {
        console.error('Error exporting CSV:', error);
        setExportError(`Failed to export data: ${error.message}`);
    } finally {
        setIsExporting(false);
    }
  };
  // --- END EXPORT FUNCTIONALITY ---


  return (
    <>
      <div className="p-4 bg-white rounded-lg shadow">
        {/* Header with Title and Export Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-xl font-semibold text-gray-800">Expenses</h2>
            <button
                onClick={handleExportCSV}
                disabled={isExporting || loading} // Disable if loading list or exporting
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
                title="Export all expenses to CSV"
            >
                {isExporting ? <Loader2 className="animate-spin h-4 w-4" /> : <Download size={16} />}
                {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
        </div>
        {exportError && (
            <div className="mb-4 p-2 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm text-center">
                {exportError}
            </div>
        )}


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
                    ref={searchInputRef} type="search" id="search" placeholder="Search descriptions..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    disabled={loading}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} disabled={loading}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" title="Clear search">
                        <X size={16} />
                    </button>
                )}
             </div>
             <button onClick={clearFiltersAndSearch} disabled={loading}
                className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1 flex-shrink-0"
                title="Clear all filters and search">
                <FilterX size={16} /> Clear All
              </button>
          </div>
          {/* Row 2: Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" id="filterStartDate" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={loading} />
            </div>
            <div>
              <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" id="filterEndDate" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
                min={filterStartDate || undefined}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={loading || !filterStartDate} />
            </div>
            <div>
              <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700">Category</label>
              <select id="filterCategory" value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={loading || categories.length === 0}>
                <option value="">All Categories</option>
                {categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (<div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">{error}</div>)}

        {/* Loading or Empty/Table Display */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin h-8 w-8 mr-3" /> Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 px-4">
             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
             <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
             <p className="mt-1 text-sm text-gray-500">
                {filterStartDate || filterEndDate || filterCategoryId || debouncedSearchTerm ? "Try adjusting your search or filters." : "Get started by adding your first expense!"}
             </p>
             {(filterStartDate || filterEndDate || filterCategoryId || debouncedSearchTerm) && (
                <div className="mt-6">
                    <button type="button" onClick={clearFiltersAndSearch}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <FilterX size={16} className="-ml-1 mr-2 h-5 w-5" /> Clear Filters & Search
                    </button>
                </div>
             )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('expense_date')}>Date {renderSortIcon('expense_date')}</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('description')}>Description {renderSortIcon('description')}</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('categories')}>Category {renderSortIcon('categories')}</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>Amount {renderSortIcon('amount')}</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className={`hover:bg-gray-50 ${deletingId === expense.id ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(expense.expense_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={expense.description || ''}>{expense.description || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{expense.categories?.name || <span className="italic text-gray-400">Uncategorized</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">${typeof expense.amount === 'number' ? expense.amount.toFixed(2) : expense.amount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button onClick={() => handleEditClick(expense)} disabled={deletingId === expense.id || isEditModalOpen || loading}
                        className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300" title="Edit Expense">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} disabled={deletingId === expense.id || isEditModalOpen || loading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300" title="Delete Expense">
                        {deletingId === expense.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 size={16} />}
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
      <EditExpenseModal isOpen={isEditModalOpen} onClose={handleCloseModal} onSave={handleSaveExpense} expense={editingExpense} categories={categories} />
    </>
  )
}
