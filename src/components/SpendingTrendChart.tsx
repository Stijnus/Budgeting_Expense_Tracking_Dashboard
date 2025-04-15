import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';

type Expense = Database['public']['Tables']['expenses']['Row'];

interface TrendData {
  date: string; // e.g., 'YYYY-MM' or 'YYYY-MM-DD' depending on aggregation
  amount: number;
}

interface SpendingTrendChartProps {
  setRefetch?: (refetchFn: () => void) => void;
}

// Helper function to format date (e.g., to 'YYYY-MM')
const formatDateToMonth = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 because months are 0-indexed, padStart for '01', '02' etc.
  return `${year}-${month}`;
};


export default function SpendingTrendChart({ setRefetch }: SpendingTrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendData = useCallback(async () => {
    // setLoading(true); // Avoid flicker on refetch
    setError(null);
    console.log("TrendChart: Fetching data...");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw sessionError || new Error('User not logged in');

      // Fetch expenses, ordered by date to make aggregation easier
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('user_id', session.user.id)
        .order('expense_date', { ascending: true }); // Order by date

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
    setLoading(true); // Initial load
    fetchTrendData();
    if (setRefetch) {
      setRefetch(() => fetchTrendData);
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
      // Ensure amount is a number and date is valid
      const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount || '0');
      if (isNaN(amount) || !expense.expense_date) return;

      const monthKey = formatDateToMonth(expense.expense_date);
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
    });

    // Convert aggregated data to the format Recharts expects and sort by date
    const formattedData = Object.entries(monthlyTotals)
      .map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

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

  return (
    <div className="p-4 bg-white rounded-lg shadow h-96">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Spending Trend</h2>
      {loading && <p className="text-gray-500 text-center pt-10">Loading chart data...</p>}
      {error && <p className="text-red-600 text-center pt-10">{error}</p>}
      {!loading && !error && trendData.length === 0 && (
        <p className="text-gray-500 text-center pt-10">Not enough data to display spending trend.</p>
      )}
      {!loading && !error && trendData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} name="Total Spent" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
