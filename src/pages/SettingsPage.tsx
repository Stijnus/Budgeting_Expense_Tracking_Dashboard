import React from "react";
import UserProfile from "../components/UserProfile";
import HouseholdManager from "../components/HouseholdManager";
import ActivatedUsersList from "../components/ActivatedUsersList";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Database,
  Shield,
  Palette,
  Users,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";

const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    currency,
    setCurrency,
    notifications,
    setNotificationSetting,
    isLoading,
  } = useSettings();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <header className="mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon size={28} className="text-gray-700" />
          Settings
        </h1>
      </header>

      <main className="space-y-8 max-w-4xl mx-auto">
        {/* Section 1: User Profile */}
        <section
          aria-labelledby="user-profile-heading"
          className="bg-white rounded-lg shadow p-6"
        >
          <h2
            id="user-profile-heading"
            className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <Shield size={20} className="text-gray-600" />
            Profile & Security
          </h2>
          <UserProfile />
        </section>

        {/* Section 2: Household Management */}
        <section
          aria-labelledby="household-management-heading"
          className="bg-white rounded-lg shadow p-6"
        >
          <h2
            id="household-management-heading"
            className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <Database size={20} className="text-gray-600" />
            Household Management
          </h2>
          <HouseholdManager />
        </section>

        {/* Section 3: Appearance */}
        <section
          aria-labelledby="appearance-heading"
          className="bg-white rounded-lg shadow p-6"
        >
          <h2
            id="appearance-heading"
            className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <Palette size={20} className="text-gray-600" />
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Theme</h3>
                <p className="text-sm text-gray-500">
                  Choose your preferred theme
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-md hover:bg-gray-100 ${
                    theme === "light" ? "bg-gray-100 ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={20} className="text-gray-600" />
                </button>
                <button
                  className={`p-2 rounded-md hover:bg-gray-100 ${
                    theme === "dark" ? "bg-gray-100 ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Currency Display</h3>
                <p className="text-sm text-gray-500">
                  Choose your preferred currency format
                </p>
              </div>
              <select
                className="form-select rounded-md border-gray-300"
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as "EUR" | "USD" | "GBP")
                }
              >
                <option value="EUR">€ (EUR)</option>
                <option value="USD">$ (USD)</option>
                <option value="GBP">£ (GBP)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 4: Notifications */}
        <section
          aria-labelledby="notifications-heading"
          className="bg-white rounded-lg shadow p-6"
        >
          <h2
            id="notifications-heading"
            className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <Bell size={20} className="text-gray-600" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Budget Alerts</h3>
                <p className="text-sm text-gray-500">
                  Get notified when you're close to your budget limit
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications.budgetAlerts}
                  onChange={(e) =>
                    setNotificationSetting("budgetAlerts", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Monthly Reports</h3>
                <p className="text-sm text-gray-500">
                  Receive monthly spending reports via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications.monthlyReports}
                  onChange={(e) =>
                    setNotificationSetting("monthlyReports", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Bill Reminders</h3>
                <p className="text-sm text-gray-500">
                  Get reminded about upcoming bill payments
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications.billReminders}
                  onChange={(e) =>
                    setNotificationSetting("billReminders", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Section 5: User Management */}
        <section
          aria-labelledby="user-management-heading"
          className="bg-white rounded-lg shadow p-6"
        >
          <h2
            id="user-management-heading"
            className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <Users size={20} className="text-gray-600" />
            User Management
          </h2>
          <ActivatedUsersList />
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
