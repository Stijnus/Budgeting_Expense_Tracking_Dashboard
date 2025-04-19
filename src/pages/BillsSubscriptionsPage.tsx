import { useState, useEffect } from "react";
import { useAuth } from "../state/auth/useAuth";
import { AppLayout } from "../shared/components/layout";
import {
  CreditCard,
  Plus,
  Calendar,
  AlertTriangle,
  Check,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  getBillsSubscriptions,
  addBillSubscription,
  markBillAsPaid,
  deleteBillSubscription,
} from "../api/supabase";
import type { Database } from "../api/types/database.types";

type BillSubscription = Database["public"]["Tables"]["bills_subscriptions"]["Row"];

export default function BillsSubscriptionsPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">("dashboard");
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<BillSubscription[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    due_date: new Date().toISOString().split('T')[0],
    frequency: "monthly",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBills();
    }
  }, [user]);

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBillsSubscriptions(user!.id);
      setBills(data);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setError("Failed to load bills and subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.name.trim()) throw new Error("Name is required");
      if (!formData.amount || parseFloat(formData.amount) <= 0) throw new Error("Amount must be greater than 0");
      if (!formData.due_date) throw new Error("Due date is required");

      await addBillSubscription({
        user_id: user!.id,
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        frequency: formData.frequency,
        notes: formData.notes.trim() || null,
        is_paid: false
      });

      // Reset form
      setFormData({
        name: "",
        amount: "",
        due_date: new Date().toISOString().split('T')[0],
        frequency: "monthly",
        notes: ""
      });

      // Refresh bills list
      fetchBills();
    } catch (err) {
      console.error("Error adding bill:", err);
      setError(err instanceof Error ? err.message : "Failed to add bill/subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    setProcessingId(id);
    try {
      await markBillAsPaid(id);
      // Update local state
      setBills(prev => prev.map(bill => 
        bill.id === id ? { ...bill, is_paid: true } : bill
      ));
    } catch (err) {
      console.error("Error marking bill as paid:", err);
      setError("Failed to update bill status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bill/subscription?")) {
      return;
    }
    
    setProcessingId(id);
    try {
      await deleteBillSubscription(id);
      // Update local state
      setBills(prev => prev.filter(bill => bill.id !== id));
    } catch (err) {
      console.error("Error deleting bill:", err);
      setError("Failed to delete bill/subscription");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusClass = (bill: BillSubscription) => {
    if (bill.is_paid) {
      return "bg-green-100 text-green-800";
    }
    
    const dueDate = new Date(bill.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "bg-red-100 text-red-800"; // Overdue
    } else if (diffDays <= 3) {
      return "bg-amber-100 text-amber-800"; // Due soon
    } else {
      return "bg-blue-100 text-blue-800"; // Upcoming
    }
  };

  const getStatusText = (bill: BillSubscription) => {
    if (bill.is_paid) {
      return "Paid";
    }
    
    const dueDate = new Date(bill.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffDays} days`;
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
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <CreditCard className="h-6 w-6 text-indigo-500 mr-2" />
          Bills & Subscriptions
        </h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Add New Bill/Subscription Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <Plus className="h-5 w-5 text-green-500 mr-2" />
              Add New Bill/Subscription
            </h2>
          </div>
          <div className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Netflix, Rent, etc."
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={submitting}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="Additional details..."
                  disabled={submitting}
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>Add Bill/Subscription</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Bills & Subscriptions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
              Upcoming Bills & Subscriptions
            </h2>
            <button 
              onClick={fetchBills}
              className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                <span className="ml-2 text-gray-600">Loading bills...</span>
              </div>
            ) : bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Bills or Subscriptions Yet
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Add your recurring bills and subscriptions to track them and get
                  reminders before they're due.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bill.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${bill.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(bill.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {bill.frequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(bill)}`}>
                            {getStatusText(bill)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          <div className="flex justify-end space-x-2">
                            {!bill.is_paid && (
                              <button
                                onClick={() => handleMarkAsPaid(bill.id)}
                                disabled={processingId === bill.id}
                                className="p-1 text-green-600 hover:text-green-800 rounded hover:bg-green-100 disabled:opacity-50"
                                title="Mark as Paid"
                              >
                                {processingId === bill.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Check className="h-5 w-5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(bill.id)}
                              disabled={processingId === bill.id}
                              className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100 disabled:opacity-50"
                              title="Delete"
                            >
                              {processingId === bill.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
