import { useState } from "react";
import { useAuth } from "../state/auth/useAuth";
import { AppLayout } from "../shared/components/layout";
import { LineChart, BarChart4, PieChart, TrendingUp } from "lucide-react";
import { ExpenseCategoryChart, IncomeExpenseChart } from "../features/dashboard/components";
import { CategoryPieChart, SpendingTrendChart } from "../features/budgets/components";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">("dashboard");
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("month"); // month, quarter, year

  if (!user) return null;

  return (
    <AppLayout
      session={user}
      currentView={currentView}
      onNavigate={setCurrentView}
      loading={loading}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
            <LineChart className="h-6 w-6 text-indigo-500 mr-2" />
            Analytics
          </h1>
          
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setTimeRange("month")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                timeRange === "month"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("quarter")}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === "quarter"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border-t border-b border-gray-300`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("year")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                timeRange === "year"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300`}
            >
              Year
            </button>
          </div>
        </div>
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses by Category */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <PieChart className="h-5 w-5 text-indigo-500 mr-2" />
                Expenses by Category
              </h2>
            </div>
            <div className="p-4 h-80">
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
            <div className="p-4 h-80">
              <IncomeExpenseChart />
            </div>
          </div>
          
          {/* Spending Trend */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <LineChart className="h-5 w-5 text-indigo-500 mr-2" />
                Spending Trend
              </h2>
            </div>
            <div className="p-4 h-80">
              <SpendingTrendChart />
            </div>
          </div>
          
          {/* Budget vs. Actual */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <BarChart4 className="h-5 w-5 text-indigo-500 mr-2" />
                Budget vs. Actual
              </h2>
            </div>
            <div className="p-4 h-80">
              <CategoryPieChart />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
