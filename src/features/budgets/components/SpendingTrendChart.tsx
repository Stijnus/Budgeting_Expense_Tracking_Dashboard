// src/features/budgets/components/SpendingTrendChart.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../../api/supabase/client";
import type { Database } from "../../../api/types/database.types";
import {
  Loader2,
  AlertTriangle,
  LineChart as LineChartIcon,
} from "lucide-react";

type Expense = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  category_color: string | null;
};

type Income = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string | null;
  income_date: string;
  created_at: string;
  updated_at: string;
};

interface TrendData {
  date: string; // 'YYYY-MM'
  income: number;
  expense: number;
}

interface SpendingTrendChartProps {
  setRefetch?: (refetchFn: () => void) => void;
}

// Helper function to format date to 'YYYY-MM'
const formatDateToMonth = (
  dateString: string | null | undefined
): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    // Check if date is valid after parsing
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string encountered: ${dateString}`);
      return null;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  } catch (e) {
    console.error(`Error parsing date string: ${dateString}`, e);
    return null;
  }
};

export default function SpendingTrendChart({
  setRefetch,
}: SpendingTrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    setError(null);
    console.log("TrendChart: Fetching income & expense data...");
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user)
        throw sessionError || new Error("User not logged in");
      const userId = session.user.id;

      // Fetch both expenses and incomes
      const [expensesResult, incomesResult] = await Promise.all([
        supabase
          .from("expenses")
          .select("amount, expense_date")
          .eq("user_id", userId)
          .order("expense_date", { ascending: true }),
        supabase
          .from("incomes")
          .select("amount, income_date")
          .eq("user_id", userId)
          .order("income_date", { ascending: true }),
      ]);

      if (expensesResult.error) throw expensesResult.error;
      if (incomesResult.error) throw incomesResult.error;

      processTrendData(expensesResult.data || [], incomesResult.data || []);
    } catch (error: any) {
      console.error("Error fetching data for trend chart:", error);
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

  const processTrendData = (
    expenses: Pick<Expense, "amount" | "expense_date">[],
    incomes: Pick<Income, "amount" | "income_date">[]
  ) => {
    const monthlyData: { [key: string]: { income: number; expense: number } } =
      {};

    // Process Incomes
    incomes.forEach((income) => {
      const amount =
        typeof income.amount === "number"
          ? income.amount
          : parseFloat(income.amount || "0");
      const monthKey = formatDateToMonth(income.income_date);
      if (isNaN(amount) || !monthKey) return;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      monthlyData[monthKey].income += amount;
    });

    // Process Expenses
    expenses.forEach((expense) => {
      const amount =
        typeof expense.amount === "number"
          ? expense.amount
          : parseFloat(expense.amount || "0");
      const monthKey = formatDateToMonth(expense.expense_date);
      if (isNaN(amount) || !monthKey) return;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      monthlyData[monthKey].expense += amount;
    });

    // Convert aggregated data to the format Recharts expects and sort by date
    const formattedData = Object.entries(monthlyData)
      .map(([date, amounts]) => ({
        date,
        income: parseFloat(amounts.income.toFixed(2)),
        expense: parseFloat(amounts.expense.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

    setTrendData(formattedData);
  };

  // Custom Tooltip for Line Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomePayload = payload.find((p: any) => p.dataKey === "income");
      const expensePayload = payload.find((p: any) => p.dataKey === "expense");
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow text-sm">
          <p className="font-semibold">{`Month: ${label}`}</p>
          {incomePayload && (
            <p
              style={{ color: incomePayload.color }}
            >{`Income: $${incomePayload.value.toFixed(2)}`}</p>
          )}
          {expensePayload && (
            <p
              style={{ color: expensePayload.color }}
            >{`Expenses: $${expensePayload.value.toFixed(2)}`}</p>
          )}
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
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex-shrink-0">
        Income vs. Expense Trend
      </h2>
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
        {/* Check if there's enough data points for *either* income or expenses */}
        {!loading && !error && trendData.length < 2 && (
          <div className="text-center text-gray-500 px-4">
            <LineChartIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Not Enough Data
            </h3>
            <p className="mt-1 text-sm">
              Add income or expenses spanning at least two different months to
              see a trend.
            </p>
          </div>
        )}
        {!loading && !error && trendData.length >= 2 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{
                top: 5,
                right: 10,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10 }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e" // Green for income
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 3 }}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#8884d8" // Existing color for expenses
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 3 }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
