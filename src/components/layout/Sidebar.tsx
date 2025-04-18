import React from "react";
import { LayoutDashboard, Settings, LucideIcon } from "lucide-react"; // Example icons

interface SidebarProps {
  currentView: "dashboard" | "settings";
  onNavigate: (view: "dashboard" | "settings") => void;
  isOpen?: boolean; // For mobile state
  onClose?: () => void; // For mobile overlay click
}

// Define navigation items
const navigationItems: Array<{
  name: string;
  view: "dashboard" | "settings";
  icon: LucideIcon;
}> = [
  { name: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { name: "Settings", view: "settings", icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen = true,
  onClose,
}) => {
  // Basic navigation handler - in a real app, use react-router or similar
  const handleNavigation = (view: "dashboard" | "settings") => {
    onNavigate(view);
    if (onClose) onClose(); // Close sidebar on mobile after navigation
  };

  const baseClasses =
    "fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white transition-transform duration-300 ease-in-out transform";
  const openClasses = "translate-x-0";
  const closedClasses = "-translate-x-full";
  const desktopClasses = "lg:translate-x-0 lg:static lg:inset-0"; // Always visible on desktop

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${baseClasses} ${
          isOpen ? openClasses : closedClasses
        } ${desktopClasses}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header (optional) */}
          <div className="h-16 flex items-center justify-center flex-shrink-0 border-b border-gray-700">
            <span className="text-lg font-semibold">Menu</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigationItems.map((item) => {
              // Determine if the item's target view matches the current view
              // This is a basic highlight, might need refinement based on actual routing
              const isActive = item.view === currentView;

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.view)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <item.icon size={18} className="mr-3 flex-shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer (optional) */}
          <div className="p-4 border-t border-gray-700 flex-shrink-0">
            <p className="text-xs text-gray-400 text-center">
              &copy; 2024 Budget App
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
