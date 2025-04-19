import React from "react";
import {
  LayoutDashboard,
  Settings,
  X,
  PieChart,
  Wallet,
  CreditCard,
  LineChart,
  Goal,
  Clock,
} from "lucide-react";

interface SidebarProps {
  currentView: "dashboard" | "settings";
  onNavigate: (view: "dashboard" | "settings") => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const menuItems = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      view: "dashboard" as const,
    },
    {
      title: "Categories",
      icon: PieChart,
      view: "dashboard" as const,
    },
    {
      title: "Transactions",
      icon: Wallet,
      view: "dashboard" as const,
    },
    {
      title: "Bills & Subscriptions",
      icon: CreditCard,
      view: "dashboard" as const,
    },
    {
      title: "Analytics",
      icon: LineChart,
      view: "dashboard" as const,
    },
    {
      title: "Goals",
      icon: Goal,
      view: "dashboard" as const,
    },
    {
      title: "History",
      icon: Clock,
      view: "dashboard" as const,
    },
    {
      title: "Settings",
      icon: Settings,
      view: "settings" as const,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col w-72 bg-white/80 backdrop-blur-xl border-r border-gray-100 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-all duration-300 ease-in-out md:translate-x-0 md:relative md:w-64`}
      >
        {/* Close button - mobile only */}
        <div className="absolute right-0 top-0 -mr-12 pt-4 md:hidden">
          <button
            type="button"
            className="p-2 rounded-xl bg-white/80 backdrop-blur-xl text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all duration-200"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
          <nav className="flex-1 px-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  onNavigate(item.view);
                  onClose();
                }}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentView === item.view && item.title === "Overview"
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200"
                    : currentView === item.view
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    currentView === item.view && item.title === "Overview"
                      ? "text-white"
                      : currentView === item.view
                      ? "text-indigo-600"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                {item.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Pro upgrade banner */}
        <div className="p-4">
          <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 text-white">
            <h3 className="text-sm font-semibold mb-2">Upgrade to Pro</h3>
            <p className="text-xs text-indigo-100 mb-3">
              Get advanced analytics and exclusive features
            </p>
            <button className="w-full px-3 py-2 text-xs font-medium bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors duration-200">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
