import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { supabase } from "../../../api/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";

// Define the data structure for the chart
interface ChartData {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33F5",
  "#33FFF5",
  "#F5FF33",
  "#FF3333",
  "#808080",
];

const ExpenseCategoryChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log("ExpenseCategoryChart: Starting data fetch...");
      setLoading(true);
      setError(null);

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log(
          "ExpenseCategoryChart: Fetch timeout reached, resetting loading state"
        );
        setLoading(false);
        setError("Request timed out. Please try again later.");
      }, 15000); // 15 second timeout

      try {
        // Get current month date range
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDate = firstDay.toISOString().split("T")[0];
        const endDate = lastDay.toISOString().split("T")[0];

        console.log("ExpenseCategoryChart: Fetching user data...");
        // Get user ID
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("ExpenseCategoryChart: User error:", userError);
          throw userError;
        }

        if (!user) {
          console.error("ExpenseCategoryChart: No user found");
          throw new Error("User not found");
        }

        console.log("ExpenseCategoryChart: User found, fetching categories...");

        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, color")
          .eq("user_id", user.id);

        if (categoriesError) {
          console.error(
            "ExpenseCategoryChart: Categories fetch error:",
            categoriesError
          );
          throw categoriesError;
        }

        console.log(
          `ExpenseCategoryChart: Found ${
            categories?.length || 0
          } categories, fetching transactions...`
        );

        // Fetch transactions for the current month
        const { data: transactions, error: transactionsError } = await supabase
          .from("transactions")
          .select("amount, category_id")
          .eq("user_id", user.id)
          .eq("type", "EXPENSE")
          .gte("date", startDate)
          .lte("date", endDate);

        if (transactionsError) {
          console.error(
            "ExpenseCategoryChart: Transactions fetch error:",
            transactionsError
          );
          throw transactionsError;
        }

        console.log(
          `ExpenseCategoryChart: Found ${
            transactions?.length || 0
          } transactions, calculating totals...`
        );

        // Handle null or undefined data
        const safeCategories = categories || [];
        const safeTransactions = transactions || [];

        // Calculate totals by category
        const categoryTotals: Record<string, number> = {};
        let uncategorizedTotal = 0;

        safeTransactions.forEach((transaction) => {
          if (transaction.category_id) {
            categoryTotals[transaction.category_id] =
              (categoryTotals[transaction.category_id] || 0) +
              transaction.amount;
          } else {
            uncategorizedTotal += transaction.amount;
          }
        });

        // Prepare chart data
        const chartData: ChartData[] = safeCategories
          .filter((category) => categoryTotals[category.id] > 0)
          .map((category, index) => ({
            name: category.name,
            value: categoryTotals[category.id] || 0,
            color: category.color || COLORS[index % COLORS.length],
          }));

        // Add uncategorized if there are any
        if (uncategorizedTotal > 0) {
          chartData.push({
            name: "Uncategorized",
            value: uncategorizedTotal,
            color: "#CCCCCC",
          });
        }

        console.log(
          "ExpenseCategoryChart: Setting chart data with",
          chartData.length,
          "items"
        );
        setData(chartData);
      } catch (err) {
        console.error("ExpenseCategoryChart: Error fetching chart data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setData([]); // Set empty data on error
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        console.log("ExpenseCategoryChart: Loading state set to false");
      }
    };

    fetchData();

    // Add a safety timeout to ensure loading state is reset
    const safetyTimeout = setTimeout(() => {
      // Use a function to get the current loading state to avoid dependency issues
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.log(
            "ExpenseCategoryChart: Safety timeout triggered, resetting loading state"
          );
          setError("Request took too long. Please try again later.");
          return false;
        }
        return currentLoading;
      });
    }, 20000); // 20 second safety timeout

    return () => {
      clearTimeout(safetyTimeout);
      console.log(
        "ExpenseCategoryChart: Component unmounted, cleanup complete"
      );
    };
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
        <p className="text-gray-500">
          No expense data available for this period
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Add some expenses to see your spending breakdown
        </p>
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
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpenseCategoryChart;
