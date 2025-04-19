// src/features/budgets/components/CategoryPieChart.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../../api/supabase/client";
import type { Database } from "../../../api/types/database.types";
import { Loader2, AlertTriangle, PieChart as PieChartIcon } from "lucide-react"; // Import icons

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

interface ChartData {
  name: string;
  value: number;
}

// Define some colors for the pie chart slices
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
  "#ffc658",
  "#a4de6c",
  "#d0ed57",
  "#ff7300",
];

interface CategoryPieChartProps {
  setRefetch?: (refetchFn: () => void) => void; // Prop to expose refetch function
}

export default function CategoryPieChart({
  setRefetch,
}: CategoryPieChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    setError(null);
    console.log("PieChart: Fetching data...");
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user)
        throw sessionError || new Error("User not logged in");

      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select(
          `
          amount,
          category_name
        `
        )
        .eq("user_id", session.user.id);

      if (expensesError) throw expensesError;

      if (expenses) {
        processChartData(expenses);
      } else {
        setChartData([]);
      }
    } catch (error: any) {
      console.error("Error fetching expense data for chart:", error);
      setError(`Failed to load chart data: ${error.message}`);
      setChartData([]);
    } finally {
      setLoading(false);
      console.log("PieChart: Fetch complete.");
    }
  }, []);

  useEffect(() => {
    fetchExpenseData(true); // Initial load
    if (setRefetch) {
      setRefetch(() => () => fetchExpenseData(false)); // Subsequent refetches
    }
    return () => {
      if (setRefetch) {
        setRefetch(() => {});
      }
    };
  }, [fetchExpenseData, setRefetch]);

  const processChartData = (
    expenses: Pick<Expense, "amount" | "category_name">[]
  ) => {
    const categoryTotals: { [key: string]: number } = {};

    expenses.forEach((expense) => {
      const amount =
        typeof expense.amount === "number"
          ? expense.amount
          : parseFloat(expense.amount || "0");
      if (isNaN(amount)) return;

      const categoryName = expense.category_name || "Uncategorized";
      categoryTotals[categoryName] =
        (categoryTotals[categoryName] || 0) + amount;
    });

    const formattedData = Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending

    setChartData(formattedData);
  };

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = payload[0].percent
        ? (payload[0].percent * 100).toFixed(1)
        : 0;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow text-sm">
          <p className="font-semibold">{`${data.name}`}</p>
          <p>{`Amount: $${data.value.toFixed(2)}`}</p>
          <p>{`Percentage: ${percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Legend Content for better responsiveness
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-2 max-h-20 overflow-y-auto px-2">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <span
              className="w-3 h-3 mr-1 inline-block"
              style={{ backgroundColor: entry.color }}
            ></span>
            <span>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow h-96 flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex-shrink-0">
        Expenses by Category
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
        {!loading && !error && chartData.length === 0 && (
          <div className="text-center text-gray-500 px-4">
            <PieChartIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No Data Available
            </h3>
            <p className="mt-1 text-sm">
              Add some expenses to see a breakdown by category.
            </p>
          </div>
        )}
        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%" // Adjust cy if legend takes too much space
                labelLine={false}
                outerRadius="70%" // Adjust radius based on container size
                innerRadius="35%" // Make it a donut chart
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
