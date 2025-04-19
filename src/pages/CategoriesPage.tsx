import { useState } from "react";
import { useAuth } from "../state/auth/useAuth";
import { Categories } from "../features/expenses/components";
import { AppLayout } from "../shared/components/layout";
import { PieChart } from "lucide-react";

export default function CategoriesPage() {
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
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <PieChart className="h-6 w-6 text-indigo-500 mr-2" />
          Categories
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <Categories />
        </div>
      </div>
    </AppLayout>
  );
}
