import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./state/auth/AuthContext";
import { SettingsProvider } from "./state/settings/SettingsContext";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import BudgetsPage from "./pages/BudgetsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
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
              path="/budgets"
              element={
                <ProtectedRoute>
                  <BudgetsPage />
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
