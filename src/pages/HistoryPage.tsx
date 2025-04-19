import { useState, useEffect } from "react";
import { useAuth } from "../state/auth/useAuth";
import { AppLayout } from "../shared/components/layout";
import { Clock, Search, Filter, Download, Loader2 } from "lucide-react";
import { supabase } from "../api/supabase/client";
import type { Database } from "../api/types/database.types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  categories?: { name: string; color: string } | null;
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">("dashboard");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filterType, dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select(`
          *,
          categories (
            name,
            color
          )
        `)
        .eq("user_id", user?.id)
        .gte("date", dateRange.startDate)
        .lte("date", dateRange.endDate)
        .order("date", { ascending: false });

      if (filterType !== "ALL") {
        query = query.eq("type", filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.categories?.name.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Clock className="h-6 w-6 text-indigo-500 mr-2" />
          Transaction History
        </h1>
        
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "ALL" | "EXPENSE" | "INCOME")}
              >
                <option value="ALL">All Transactions</option>
                <option value="EXPENSE">Expenses Only</option>
                <option value="INCOME">Income Only</option>
              </select>
            </div>
            
            <div>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            
            <div>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
            
            <button
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        
        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              Transactions ({filteredTransactions.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No transactions found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transaction.categories ? (
                          <span 
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: transaction.categories.color ? `${transaction.categories.color}20` : '#e5e7eb',
                              color: transaction.categories.color || '#374151'
                            }}
                          >
                            {transaction.categories.name}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.type === "EXPENSE" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        transaction.type === "EXPENSE" 
                          ? "text-red-600" 
                          : "text-green-600"
                      }`}>
                        {transaction.type === "EXPENSE" ? "-" : "+"}
                        ${transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
