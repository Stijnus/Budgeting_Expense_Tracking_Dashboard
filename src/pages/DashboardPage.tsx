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
import {
  Wallet,
  DollarSign,
  PieChart,
  TrendingUp,
  Calendar,
  AlertTriangle,
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

  // Function to fetch dashboard summary data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("User not found");

      // Get current month date range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      // Fetch all transactions - we don't need to filter by date here since we'll do that in memory
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("amount, type, date")
        .eq("user_id", user.id);

      if (transactionsError) throw transactionsError;

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

      setTotalBalance(balance);
      setMonthlyExpenses(expenses);
      setMonthlyIncome(income);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Function to refresh data
  const refreshData = () => {
    fetchDashboardData();
  };

  // Handle expense or income added
  const handleTransactionAdded = () => {
    refreshData();
  };

  if (!user) return null;

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
            <p className="text-sm text-gray-500 mt-2">Updated just now</p>
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
              ${monthlyIncome > monthlyExpenses ? "On Track" : "Over Budget"}
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
              <button className="p-1 text-gray-400 hover:text-gray-600">
                &lt;
              </button>
              <span className="text-sm font-medium">April 2023</span>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                &gt;
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="p-3 rounded-full bg-red-50 mb-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-500 font-medium">
                Failed to load report data
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Relation "public.incomes" does not exist
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
