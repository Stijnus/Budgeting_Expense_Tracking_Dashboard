import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Wallet, LogOut, ChevronDown } from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to landing page after signing out
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-indigo-600" />
              <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Budget Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button className="inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none">
                  <span className="mr-2">{user?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder cards for budget overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Total Balance
              </h3>
              <p className="text-3xl font-bold text-indigo-600">$0.00</p>
              <p className="text-sm text-gray-500 mt-2">Updated just now</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Monthly Expenses
              </h3>
              <p className="text-3xl font-bold text-purple-600">$0.00</p>
              <p className="text-sm text-gray-500 mt-2">This month</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Budget Status
              </h3>
              <p className="text-3xl font-bold text-green-600">On Track</p>
              <p className="text-sm text-gray-500 mt-2">You're doing great!</p>
            </div>
          </div>

          {/* Placeholder for charts and detailed content */}
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">
                Your transaction history will appear here
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
