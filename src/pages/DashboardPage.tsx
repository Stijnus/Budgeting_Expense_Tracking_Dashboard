import { useState, useEffect } from "react";
import { useAuth } from "../state/auth/useAuth";
import { AppLayout } from "../shared/components/layout";
import { ExpenseForm, IncomeForm } from "../features/expenses/components";
import { BudgetManager } from "../features/budgets/components";
import {
  ExpenseCategoryChart,
  IncomeExpenseChart,
} from "../features/dashboard/components";
import { supabase } from "../api/supabase/client";
import { getUserTransactions, retryQuery } from "../utils/db-helpers";
import {
  Wallet,
  DollarSign,
  PieChart,
  TrendingUp,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">(
    "dashboard"
  );
  const [loading, setLoading] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch dashboard summary data
  const fetchDashboardData = async () => {
    console.log("Dashboard: Starting data fetch...");
    setLoading(true);
    setError(null);

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Dashboard: Fetch timeout reached, resetting loading state");
      setLoading(false);
      setError("Data fetch timed out. Please try again.");
    }, 20000); // 20 second timeout

    try {
      // Use retryQuery to get the current user with retries
      const currentUser = await retryQuery(async () => {
        console.log("Dashboard: Fetching user data...");
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Dashboard: User error:", userError);
          throw userError;
        }

        if (!user) {
          console.error("Dashboard: No user found");
          throw new Error("User not found");
        }

        return user;
      });

      console.log("Dashboard: User found, fetching transactions...");

      // Get current month date range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Use our utility function to get transactions with retry and fallback
      const transactions = await getUserTransactions(currentUser.id);

      console.log(
        `Dashboard: Found ${transactions.length} transactions, calculating totals...`
      );

      // Calculate total balance
      const balance = transactions.reduce((sum, transaction) => {
        return (
          sum +
          (transaction.type === "INCOME"
            ? transaction.amount
            : -transaction.amount)
        );
      }, 0);

      // Calculate monthly expenses and income
      const monthlyTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= firstDay && transactionDate <= lastDay;
      });

      const expenses = monthlyTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);

      const income = monthlyTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

      console.log("Dashboard: Setting state with calculated values");
      setTotalBalance(balance);
      setMonthlyExpenses(expenses);
      setMonthlyIncome(income);
      setLastUpdated(new Date());
      console.log("Dashboard: Data fetch complete");
    } catch (error) {
      console.error("Dashboard: Error fetching dashboard data:", error);
      // Set default values on error
      setTotalBalance(0);
      setMonthlyExpenses(0);
      setMonthlyIncome(0);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard data"
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log("Dashboard: Loading state set to false");
    }
  };

  // Function to refresh dashboard data
  const refreshData = () => {
    fetchDashboardData();
  };

  // Fetch data on component mount
  useEffect(() => {
    console.log("Dashboard: Component mounted, fetching data...");
    fetchDashboardData();

    // Add a safety timeout to ensure loading state is reset
    const safetyTimeout = setTimeout(() => {
      // Use a function to get the current loading state to avoid dependency issues
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.log(
            "Dashboard: Safety timeout triggered, resetting loading state"
          );
          return false;
        }
        return currentLoading;
      });
    }, 20000); // 20 second safety timeout

    return () => {
      clearTimeout(safetyTimeout);
      console.log("Dashboard: Component unmounted, cleanup complete");
    };
  }, []);

  // This function is already defined above

  // Handle expense or income added
  const handleTransactionAdded = () => {
    refreshData();
  };

  if (!user) {
    console.log("Dashboard: No user found, returning null");
    return null;
  }

  return (
    <AppLayout
      session={user}
      currentView={currentView}
      onNavigate={setCurrentView}
      loading={loading}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Total Balance
            </h3>
            <p className="text-3xl font-bold text-indigo-600">
              ${totalBalance.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Not yet updated"}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Expenses
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              ${monthlyExpenses.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Budget Status
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {monthlyIncome > monthlyExpenses ? "On Track" : "Over Budget"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {monthlyIncome > monthlyExpenses
                ? "You're doing great!"
                : "Expenses exceed income this month"}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Categories and Budget */}
          <div className="space-y-6">
            {/* Spending Categories */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Spending Categories</h2>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <p className="text-gray-500 text-sm">No Categories Yet</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Add your first spending category above.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Budget */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Add New Budget</h2>
              </div>
              <div className="p-4">
                <BudgetManager />
              </div>
            </div>
          </div>

          {/* Middle Column - Income and Expense Forms */}
          <div className="space-y-6">
            {/* Add New Income */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  Add New Income
                </h2>
              </div>
              <div className="p-4">
                <IncomeForm onIncomeAdded={handleTransactionAdded} />
              </div>
            </div>

            {/* Recent Income */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Recent Income</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <DollarSign className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500">No income recorded yet.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Use the form above to add your first income entry.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Expenses */}
          <div className="space-y-6">
            {/* Add New Expense */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <Wallet className="h-5 w-5 text-red-500 mr-2" />
                  Add New Expense
                </h2>
              </div>
              <div className="p-4">
                <ExpenseForm onExpenseAdded={handleTransactionAdded} />
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Expenses</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Wallet className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500">No expenses found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Get started by adding your first expense!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Expenses by Category */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <PieChart className="h-5 w-5 text-indigo-500 mr-2" />
                Expenses by Category
              </h2>
            </div>
            <div className="p-4">
              <ExpenseCategoryChart />
            </div>
          </div>

          {/* Income vs. Expense Trend */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
                Income vs. Expense Trend
              </h2>
            </div>
            <div className="p-4">
              <IncomeExpenseChart />
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
              Monthly Summary
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshData}
                className="p-2 rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <span className="text-sm font-medium">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="p-4">
            {error ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="p-3 rounded-full bg-red-50 mb-3">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-red-500 font-medium">Failed to load data</p>
                <p className="text-gray-500 text-sm mt-1">{error}</p>
                <button
                  onClick={refreshData}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-xl font-medium text-gray-800">
                  Monthly Balance: $
                  {(monthlyIncome - monthlyExpenses).toFixed(2)}
                </p>
                <div className="flex justify-between w-full max-w-md mt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Income</p>
                    <p className="text-lg font-medium text-green-600">
                      ${monthlyIncome.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Expenses</p>
                    <p className="text-lg font-medium text-red-600">
                      ${monthlyExpenses.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
