import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';
import { Loader2, AlertTriangle, LineChart as LineChartIcon } from 'lucide-react'; // Import icons

type Expense = Database['public']['Tables']['expenses']['Row'];

interface TrendData {
  date: string; // e.g., 'YYYY-MM'
  amount: number;
}

interface SpendingTrendChartProps {
  setRefetch?: (refetchFn: () => void) => void;
}

// Helper function to format date to 'YYYY-MM'
const formatDateToMonth = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};


export default function SpendingTrendChart({ setRefetch }: SpendingTrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    setError(null);
    console.log("TrendChart: Fetching data...");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw sessionError || new Error('User not logged in');

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('user_id', session.user.id)
        .order('expense_date', { ascending: true });

      if (expensesError) throw expensesError;

      if (expenses) {
        processTrendData(expenses);
      } else {
        setTrendData([]);
      }

    } catch (error: any) {
      console.error('Error fetching expense data for trend chart:', error);
      setError(`Failed to load trend data: ${error.message}`);
      setTrendData([]);
    } finally {
      setLoading(false);
      console.log("TrendChart: Fetch complete.");
    }
  }, []);

  useEffect(() => {
    fetchTrendData(true); // Initial load
    if (setRefetch) {
      setRefetch(() => () => fetchTrendData(false)); // Subsequent refetches
    }
    return () => {
      if (setRefetch) {
        setRefetch(() => {});
      }
    };
  }, [fetchTrendData, setRefetch]);

  const processTrendData = (expenses: Pick<Expense, 'amount' | 'expense_date'>[]) => {
    const monthlyTotals: { [key: string]: number } = {};

    expenses.forEach(expense => {
      const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount || '0');
      if (isNaN(amount) || !expense.expense_date) return;

      const monthKey = formatDateToMonth(expense.expense_date);
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
    });

    const formattedData = Object.entries(monthlyTotals)
      .map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setTrendData(formattedData);
  };

  // Custom Tooltip for Line Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow text-sm">
          <p className="font-semibold">{`Month: ${label}`}</p>
          <p>{`Total Spent: $${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis ticks as currency
  const formatYAxis = (tickItem: number) => {
    return `$${tickItem.toLocaleString()}`;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow h-96 flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex-shrink-0">Monthly Spending Trend</h2>
      <div className="flex-grow flex items-center justify-center">
        {loading && (
          <div className="text-center text-gray-500">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
            <p>Loading chart data...</p>
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 px-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-semibold">Error Loading Chart</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!loading && !error && trendData.length < 2 && ( // Need at least 2 points for a trend line
          <div className="text-center text-gray-500 px-4">
             <LineChartIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
             <h3 className="mt-2 text-sm font-medium text-gray-900">Not Enough Data</h3>
             <p className="mt-1 text-sm">Add expenses spanning at least two different months to see a trend.</p>
          </div>
        )}
        {!loading && !error && trendData.length >= 2 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{
                top: 5, right: 10, left: 20, bottom: 5, // Adjusted margins
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10 }} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 3 }}
                name="Total Spent"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
