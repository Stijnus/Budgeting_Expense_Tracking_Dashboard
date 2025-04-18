import React from "react";
import UserProfile from "../components/UserProfile";
import { Settings as SettingsIcon, Shield } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";

const SettingsPage: React.FC = () => {
  const { isLoading } = useSettings();

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
      </main>
    </div>
  );
};

export default SettingsPage;
