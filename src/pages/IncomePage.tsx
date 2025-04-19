import { useState } from "react";
import { useAuth } from "../state/auth/useAuth";
import { IncomeForm, IncomeList } from "../features/expenses/components";
import { AppLayout } from "../shared/components/layout";

export default function IncomePage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">("dashboard");
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleIncomeUpdated = () => {
    // Trigger a refresh of the income list
    setRefreshTrigger(prev => prev + 1);
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
        <h1 className="text-2xl font-bold mb-6">Income Management</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <IncomeForm onIncomeAdded={handleIncomeUpdated} />
          </div>
          <div>
            <IncomeList triggerRefetch={refreshTrigger} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
