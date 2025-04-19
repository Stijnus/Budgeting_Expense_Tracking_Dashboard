import React from "react";
import {
  Menu,
  Settings,
  LogOut,
  User as UserIcon,
  Loader2,
  DollarSign,
  Bell,
  Search,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../../../state/auth/useAuth";

interface NavbarProps {
  user: User;
  currentView: "dashboard" | "settings";
  onNavigate: (view: "dashboard" | "settings") => void;
  loading: boolean;
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onNavigate,
  loading,
  onToggleSidebar,
}) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden transition-all duration-200"
              onClick={onToggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800">
                  Budget Tracker
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 transition-all duration-200"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === "dashboard"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => onNavigate("settings")}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  currentView === "settings"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">
                    {user.email?.split("@")[0]}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200"
              >
                <span className="sr-only">Sign out</span>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
