import { useState } from "react";
import { useAuth } from "../state/auth/useAuth";
import { useSettings } from "../state/settings/useSettings";
import { AppLayout } from "../shared/components/layout";
import {
  Loader2,
  Save,
  User,
  DollarSign,
  Bell,
  Moon,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const { user, profile, updateProfile } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">(
    "settings"
  );
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Settings form state
  const [currency, setCurrency] = useState(settings?.default_currency || "USD");
  const [notifications, setNotifications] = useState(
    settings?.notification_enabled || false
  );
  const [theme, setTheme] = useState(settings?.theme || "light");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error: any) {
      setProfileError(error.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(false);

    try {
      if (settings) {
        await updateSettings({
          ...settings,
          default_currency: currency as any,
          notification_enabled: notifications,
          theme,
        });
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (error: any) {
      setSettingsError(error.message || "Failed to update settings");
    } finally {
      setSettingsSaving(false);
    }
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
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="mr-2 h-5 w-5 text-indigo-600" />
              Profile Settings
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  disabled={profileSaving}
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  disabled={profileSaving}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              {profileError && (
                <div className="text-sm text-red-600">{profileError}</div>
              )}

              {profileSuccess && (
                <div className="text-sm text-green-600">
                  Profile updated successfully!
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* App Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-indigo-600" />
              App Settings
            </h2>

            {settingsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label
                    htmlFor="currency"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Default Currency
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    disabled={settingsSaving}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={settingsSaving}
                  />
                  <label
                    htmlFor="notifications"
                    className="ml-2 block text-sm text-gray-700 flex items-center"
                  >
                    <Bell className="mr-1 h-4 w-4 text-indigo-600" />
                    Enable Notifications
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="theme"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Theme
                  </label>
                  <div className="flex space-x-4">
                    <label
                      className={`flex items-center p-3 border rounded-md cursor-pointer ${
                        theme === "light"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={theme === "light"}
                        onChange={() => setTheme("light")}
                        className="sr-only"
                        disabled={settingsSaving}
                      />
                      <span className="text-sm font-medium">Light</span>
                    </label>
                    <label
                      className={`flex items-center p-3 border rounded-md cursor-pointer ${
                        theme === "dark"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={theme === "dark"}
                        onChange={() => setTheme("dark")}
                        className="sr-only"
                        disabled={settingsSaving}
                      />
                      <Moon className="mr-1 h-4 w-4" />
                      <span className="text-sm font-medium">Dark</span>
                    </label>
                  </div>
                </div>

                {settingsError && (
                  <div className="text-sm text-red-600">{settingsError}</div>
                )}

                {settingsSuccess && (
                  <div className="text-sm text-green-600">
                    Settings updated successfully!
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {settingsSaving ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
