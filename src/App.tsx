import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./state/auth/AuthContext";
import { SettingsProvider } from "./state/settings/SettingsContext";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import IncomePage from "./pages/IncomePage";
import BudgetsPage from "./pages/BudgetsPage";
import CategoriesPage from "./pages/CategoriesPage";
import BillsSubscriptionsPage from "./pages/BillsSubscriptionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import GoalsPage from "./pages/GoalsPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/" element={<LandingPage initialMode="signin" />} />
            <Route
              path="/signin"
              element={<LandingPage initialMode="signin" />}
            />
            <Route
              path="/signup"
              element={<LandingPage initialMode="signup" />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income"
              element={
                <ProtectedRoute>
                  <IncomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budgets"
              element={
                <ProtectedRoute>
                  <BudgetsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bills-subscriptions"
              element={
                <ProtectedRoute>
                  <BillsSubscriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <GoalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
