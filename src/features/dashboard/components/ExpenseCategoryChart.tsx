import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '../../../api/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';

// Define the data structure for the chart
interface ChartData {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F5', 
  '#33FFF5', '#F5FF33', '#FF3333', '#808080'
];

const ExpenseCategoryChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get current month date range
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        
        // Get user ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('User not found');
        
        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, color')
          .eq('user_id', user.id);
          
        if (categoriesError) throw categoriesError;
        
        // Fetch transactions for the current month
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount, category_id')
          .eq('user_id', user.id)
          .eq('type', 'EXPENSE')
          .gte('date', startDate)
          .lte('date', endDate);
          
        if (transactionsError) throw transactionsError;
        
        // Calculate totals by category
        const categoryTotals: Record<string, number> = {};
        let uncategorizedTotal = 0;
        
        transactions.forEach(transaction => {
          if (transaction.category_id) {
            categoryTotals[transaction.category_id] = (categoryTotals[transaction.category_id] || 0) + transaction.amount;
          } else {
            uncategorizedTotal += transaction.amount;
          }
        });
        
        // Prepare chart data
        const chartData: ChartData[] = categories
          .filter(category => categoryTotals[category.id] > 0)
          .map((category, index) => ({
            name: category.name,
            value: categoryTotals[category.id] || 0,
            color: category.color || COLORS[index % COLORS.length]
          }));
          
        // Add uncategorized if there are any
        if (uncategorizedTotal > 0) {
          chartData.push({
            name: 'Uncategorized',
            value: uncategorizedTotal,
            color: '#CCCCCC'
          });
        }
        
        setData(chartData);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading chart data...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="p-3 rounded-full bg-red-50 mb-3">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-red-500 font-medium">Error Loading Chart</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500">No expense data available for this period</p>
        <p className="text-gray-400 text-sm mt-1">Add some expenses to see your spending breakdown</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpenseCategoryChart;
