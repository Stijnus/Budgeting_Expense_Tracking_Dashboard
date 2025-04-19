import { useState } from "react";
import { useAuth } from "../state/auth/useAuth";
import { ExpenseList } from "../features/expenses/components";
import { AppLayout } from "../shared/components/layout";

export default function ExpensesPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">("dashboard");
  const [loading, setLoading] = useState(false);

  const handleExpenseUpdated = () => {
    // This function will be called when an expense is updated
    console.log("Expense updated");
  };

  if (!user) return null;

  return (
    <AppLayout
      session={user}
      currentView={currentView}
      onNavigate={setCurrentView}
      loading={loading}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Expenses</h1>
        <ExpenseList onExpenseUpdated={handleExpenseUpdated} />
      </div>
    </AppLayout>
  );
}
