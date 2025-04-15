// src/components/CategoryPieChart.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  categories: { name: string } | null
}

interface ChartData {
  name: string;
  value: number;
}

// Define some colors for the pie chart slices
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#ff7300'];

interface CategoryPieChartProps {
  setRefetch?: (refetchFn: () => void) => void; // Prop to expose refetch function
}

export default function CategoryPieChart({ setRefetch }: CategoryPieChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseData = useCallback(async () => {
    // Don't set loading true on refetch, only initial load
    // setLoading(true);
    setError(null);
    console.log("PieChart: Fetching data..."); // Log fetch start
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw sessionError || new Error('User not logged in');

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          amount,
          categories ( name )
        `)
        .eq('user_id', session.user.id);

      if (expensesError) throw expensesError;

      if (expenses) {
        processChartData(expenses);
      } else {
        setChartData([]);
      }

    } catch (error: any) {
      console.error('Error fetching expense data for chart:', error);
      setError(`Failed to load chart data: ${error.message}`);
      setChartData([]); // Clear data on error
    } finally {
      setLoading(false); // Ensure loading is false after fetch/refetch
      console.log("PieChart: Fetch complete."); // Log fetch end
    }
  }, []); // useCallback dependency array is empty

  useEffect(() => {
    setLoading(true); // Set loading true only on initial mount
    fetchExpenseData(); // Fetch data on initial mount
    if (setRefetch) {
      setRefetch(() => fetchExpenseData); // Expose the fetch function via prop
    }
    // Cleanup function for the ref (optional, good practice)
    return () => {
      if (setRefetch) {
        setRefetch(() => {}); // Clear the ref function on unmount
      }
    };
  }, [fetchExpenseData, setRefetch]); // Add dependencies

  const processChartData = (expenses: Pick<Expense, 'amount' | 'categories'>[]) => {
    const categoryTotals: { [key: string]: number } = {};

    expenses.forEach(expense => {
      const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount || '0');
      if (isNaN(amount)) return;

      const categoryName = expense.categories?.name || 'Uncategorized';
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
    });

    const formattedData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    })).sort((a, b) => b.value - a.value);

    setChartData(formattedData);
  };

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow text-sm">
          <p className="font-semibold">{`${data.name}`}</p>
          <p>{`Amount: $${data.value.toFixed(2)}`}</p>
          <p>{`Percentage: ${payload[0].percent ? (payload[0].percent * 100).toFixed(1) : 0}%`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="p-4 bg-white rounded-lg shadow h-96">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Expenses by Category</h2>
      {loading && <p className="text-gray-500 text-center pt-10">Loading chart data...</p>}
      {error && <p className="text-red-600 text-center pt-10">{error}</p>}
      {!loading && !error && chartData.length === 0 && (
        <p className="text-gray-500 text-center pt-10">No expense data available to display the chart.</p>
      )}
      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
