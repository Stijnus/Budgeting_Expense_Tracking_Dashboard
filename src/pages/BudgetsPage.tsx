import { useState } from "react";
import { useAuth } from "../state/auth/useAuth";
import { BudgetManager, MonthlyReport } from "../features/budgets/components";
import { AppLayout } from "../shared/components/layout";

export default function BudgetsPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">("dashboard");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  return (
    <AppLayout
      session={user}
      currentView={currentView}
      onNavigate={setCurrentView}
      loading={loading}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Budget Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <MonthlyReport />
          </div>
          <div className="lg:col-span-2">
            <BudgetManager />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
