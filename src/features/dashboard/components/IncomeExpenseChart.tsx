import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../api/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

const IncomeExpenseChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get user ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('User not found');
        
        // Get last 6 months
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            name: month.toLocaleString('default', { month: 'short' }),
            year: month.getFullYear(),
            month: month.getMonth() + 1,
            startDate: new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0],
            endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0]
          });
        }
        
        // Fetch transactions for the last 6 months
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount, date, type')
          .eq('user_id', user.id)
          .gte('date', months[0].startDate)
          .lte('date', months[months.length - 1].endDate)
          .order('date', { ascending: true });
          
        if (transactionsError) throw transactionsError;
        
        // Calculate monthly totals
        const monthlyData = months.map(month => {
          const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= new Date(month.startDate) && 
                   transactionDate <= new Date(month.endDate);
          });
          
          const income = monthTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);
            
          const expenses = monthTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);
            
          return {
            name: `${month.name} ${month.year}`,
            income,
            expenses
          };
        });
        
        setData(monthlyData);
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
  
  if (data.every(month => month.income === 0 && month.expenses === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500">No transaction data available</p>
        <p className="text-gray-400 text-sm mt-1">Add income and expenses to see your financial trends</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#4ade80" />
        <Bar dataKey="expenses" name="Expenses" fill="#f87171" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseChart;
