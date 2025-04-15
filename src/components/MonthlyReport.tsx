// src/components/MonthlyReport.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';
import { Loader2, AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Expense = Database['public']['Tables']['expenses']['Row'] & { categories: { name: string } | null };
type Income = Database['public']['Tables']['incomes']['Row'];

interface CategoryExpense {
    categoryId: string | null;
    categoryName: string;
    total: number;
}

interface ReportData {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    expensesByCategory: CategoryExpense[];
}

// Helper to format currency
const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Helper to get month name and year
const formatMonthYear = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Helper to get the first and last day of a given month/year
const getMonthDateRange = (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Day 0 of next month
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

export default function MonthlyReport() {
    const [currentDate, setCurrentDate] = useState(new Date()); // Represents the month to display
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReportData = useCallback(async (year: number, month: number) => {
        setLoading(true);
        setError(null);
        setReportData(null); // Clear previous data

        const { start, end } = getMonthDateRange(year, month);
        console.log(`Fetching report data for: ${start} to ${end}`);

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.user) throw sessionError || new Error('User not logged in');
            const userId = session.user.id;

            // Fetch incomes and expenses for the selected month concurrently
            const [incomesResult, expensesResult] = await Promise.all([
                supabase
                    .from('incomes')
                    .select('amount')
                    .eq('user_id', userId)
                    .gte('income_date', start)
                    .lte('income_date', end),
                supabase
                    .from('expenses')
                    .select('amount, category_id, categories ( name )') // Fetch category name
                    .eq('user_id', userId)
                    .gte('expense_date', start)
                    .lte('expense_date', end)
            ]);

            if (incomesResult.error) throw incomesResult.error;
            if (expensesResult.error) throw expensesResult.error;

            const incomes: Pick<Income, 'amount'>[] = incomesResult.data || [];
            const expenses: Pick<Expense, 'amount' | 'category_id' | 'categories'>[] = expensesResult.data || [];

            // Calculate totals
            const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const netAmount = totalIncome - totalExpenses;

            // Group expenses by category
            const expensesByCategoryMap: { [key: string]: CategoryExpense } = {};
            expenses.forEach(expense => {
                const categoryId = expense.category_id || 'uncategorized'; // Use 'uncategorized' for null ID
                const categoryName = expense.categories?.name || 'Uncategorized';

                if (!expensesByCategoryMap[categoryId]) {
                    expensesByCategoryMap[categoryId] = {
                        categoryId: expense.category_id, // Store original null if applicable
                        categoryName: categoryName,
                        total: 0,
                    };
                }
                expensesByCategoryMap[categoryId].total += expense.amount;
            });

            const expensesByCategory = Object.values(expensesByCategoryMap).sort((a, b) => b.total - a.total); // Sort descending by total

            setReportData({
                totalIncome,
                totalExpenses,
                netAmount,
                expensesByCategory,
            });

        } catch (err: any) {
            console.error('Error fetching report data:', err);
            setError(`Failed to load report data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data when the component mounts or the month changes
    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed
        fetchReportData(year, month);
    }, [currentDate, fetchReportData]);

    const goToPreviousMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const goToNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + 1);
            // Prevent going into the future? Optional.
            // const today = new Date();
            // if (newDate > today) return prevDate;
            return newDate;
        });
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Monthly Summary</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        title="Previous Month"
                        disabled={loading}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 w-32 text-center">
                        {formatMonthYear(currentDate)}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        title="Next Month"
                        disabled={loading}
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="min-h-[200px]"> {/* Min height for loading/empty */}
                {loading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="animate-spin h-6 w-6 mr-3" /> Loading report...
                    </div>
                ) : error ? (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm flex items-center gap-2">
                        <AlertTriangle size={16} /> {error}
                    </div>
                ) : !reportData ? (
                     <div className="text-center py-10 text-gray-500">
                        <CalendarDays size={32} className="mx-auto mb-2" />
                        <p>No data available for this month.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Totals Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-green-700 font-medium mb-1">Total Income</p>
                                <p className="text-xl font-semibold text-green-800">{formatCurrency(reportData.totalIncome)}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-sm text-red-700 font-medium mb-1">Total Expenses</p>
                                <p className="text-xl font-semibold text-red-800">{formatCurrency(reportData.totalExpenses)}</p>
                            </div>
                            <div className={`p-3 rounded-lg border ${reportData.netAmount >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                                <p className={`text-sm font-medium mb-1 ${reportData.netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                    Net {reportData.netAmount >= 0 ? 'Savings' : 'Loss'}
                                </p>
                                <p className={`text-xl font-semibold ${reportData.netAmount >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                                    {formatCurrency(reportData.netAmount)}
                                </p>
                            </div>
                        </div>

                        {/* Expenses by Category */}
                        <div>
                            <h3 className="text-md font-semibold mb-2 text-gray-700">Expenses by Category</h3>
                            {reportData.expensesByCategory.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No expenses recorded for this month.</p>
                            ) : (
                                <ul className="space-y-1 max-h-48 overflow-y-auto pr-2">
                                    {reportData.expensesByCategory.map((item) => (
                                        <li key={item.categoryId || 'uncategorized'} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-b-0">
                                            <span className={`truncate ${item.categoryName === 'Uncategorized' ? 'italic text-gray-500' : 'text-gray-700'}`} title={item.categoryName}>
                                                {item.categoryName}
                                            </span>
                                            <span className="font-medium text-gray-800 flex-shrink-0 ml-4">
                                                {formatCurrency(item.total)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
