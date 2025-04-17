import React from 'react';
import UserProfile from '../components/UserProfile';
import HouseholdManager from '../components/HouseholdManager';
import { Settings as SettingsIcon } from 'lucide-react';

const SettingsPage: React.FC = () => {
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
            <section aria-labelledby="user-profile-heading">
                 {/* <h2 id="user-profile-heading" className="text-xl font-semibold text-gray-800 mb-4">User Profile</h2> */}
                 <UserProfile />
            </section>

            {/* Section 2: Household Management */}
            <section aria-labelledby="household-management-heading">
                 {/* <h2 id="household-management-heading" className="text-xl font-semibold text-gray-800 mb-4">Household Management</h2> */}
                 <HouseholdManager />
            </section>

            {/* Add more settings sections here as needed */}
            {/*
            <section aria-labelledby="notifications-heading">
                 <h2 id="notifications-heading" className="text-xl font-semibold text-gray-800 mb-4">Notifications</h2>
                 <p className="text-gray-600">Notification settings will go here.</p>
            </section>
            */}
       </main>
    </div>
  );
};

export default SettingsPage;
