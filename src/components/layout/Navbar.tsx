import React from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Loader2, LogOut, Menu, Wallet } from 'lucide-react'; // Removed LayoutDashboard, Settings

interface NavbarProps {
  session: Session;
  currentView: 'dashboard' | 'settings'; // Keep for potential future use or context
  onNavigate: (view: 'dashboard' | 'settings') => void; // Keep for logo click
  loading: boolean;
  onToggleSidebar?: () => void; // For mobile sidebar toggle
}

const Navbar: React.FC<NavbarProps> = ({ session, currentView, onNavigate, loading, onToggleSidebar }) => {

  const handleLogout = async () => {
    // Loading state is managed in App.tsx via session change
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left side: Mobile Menu Toggle & Title/Logo */}
          <div className="flex items-center">
             {/* Mobile menu button */}
             {onToggleSidebar && (
                <button
                    onClick={onToggleSidebar}
                    className="mr-2 p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden" // Hidden on large screens and up
                    aria-label="Toggle sidebar"
                >
                    <Menu size={24} />
                </button>
             )}
            {/* App Title/Logo */}
            <div
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
              onClick={() => onNavigate('dashboard')} // Navigate to dashboard on logo click
              title="Go to Dashboard"
            >
              <Wallet size={28} className="text-indigo-600" /> {/* Example Icon */}
              <span className="text-xl font-bold text-gray-800 hidden sm:inline">
                Budget Tracker
              </span>
            </div>
          </div>

          {/* Center: Navigation Buttons REMOVED */}
          {/* <div className="hidden lg:flex lg:items-center lg:space-x-4"> ... </div> */}

          {/* Right side: User Info & Logout */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* User Email - hidden on very small screens, truncated on others */}
            <span className="text-sm text-gray-600 hidden sm:block truncate max-w-[100px] md:max-w-[150px]" title={session.user.email ?? 'User Email'}>
              {session.user.email ?? 'User'}
            </span>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-1"
              title="Logout"
            >
              {/* Show loader only if the main app loading state is true */}
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <LogOut size={16} />}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
