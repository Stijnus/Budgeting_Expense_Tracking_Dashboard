import { useState, useEffect } from "react";
import { useAuth } from "../state/auth/useAuth";
import { AppLayout } from "../shared/components/layout";
import { Goal, Plus, Target, AlertTriangle, Loader2, Trash2, RefreshCw, Check } from "lucide-react";
import { getFinancialGoals, addFinancialGoal, updateGoalProgress, deleteFinancialGoal } from "../api/supabase";
import type { Database } from "../api/types/database.types";

type FinancialGoal = Database["public"]["Tables"]["financial_goals"]["Row"];

export default function GoalsPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">("dashboard");
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFinancialGoals(user!.id);
      setGoals(data);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load financial goals");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) 
        throw new Error("Target amount must be greater than 0");
      
      const currentAmount = formData.current_amount ? parseFloat(formData.current_amount) : 0;
      
      await addFinancialGoal({
        user_id: user!.id,
        name: formData.name.trim(),
        target_amount: parseFloat(formData.target_amount),
        current_amount: currentAmount,
        target_date: formData.target_date || null,
        description: formData.description.trim() || null,
        is_completed: currentAmount >= parseFloat(formData.target_amount)
      });

      // Reset form
      setFormData({
        name: "",
        target_amount: "",
        current_amount: "",
        target_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        description: ""
      });

      // Refresh goals list
      fetchGoals();
    } catch (err) {
      console.error("Error adding goal:", err);
      setError(err instanceof Error ? err.message : "Failed to add financial goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (id: string, amount: string) => {
    if (!amount || parseFloat(amount) < 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    setProcessingId(id);
    try {
      await updateGoalProgress(id, parseFloat(amount));
      // Refresh goals list
      fetchGoals();
    } catch (err) {
      console.error("Error updating goal progress:", err);
      setError("Failed to update goal progress");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this financial goal?")) {
      return;
    }
    
    setProcessingId(id);
    try {
      await deleteFinancialGoal(id);
      // Update local state
      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (err) {
      console.error("Error deleting goal:", err);
      setError("Failed to delete financial goal");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No target date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateProgress = (goal: FinancialGoal) => {
    const percentage = (goal.current_amount / goal.target_amount) * 100;
    return Math.min(100, Math.round(percentage));
  };

  const getTimeRemaining = (targetDate: string | null) => {
    if (!targetDate) return "No deadline";
    
    const target = new Date(targetDate);
    const today = new Date();
    
    // If target date is in the past
    if (target < today) {
      return "Deadline passed";
    }
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return "1 day left";
    } else if (diffDays < 30) {
      return `${diffDays} days left`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} left`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''} left`;
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
          <Goal className="h-6 w-6 text-indigo-500 mr-2" />
          Financial Goals
        </h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Add New Goal Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <Plus className="h-5 w-5 text-green-500 mr-2" />
              Add New Financial Goal
            </h2>
          </div>
          <div className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Emergency Fund, New Car, etc."
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    name="target_amount"
                    value={formData.target_amount}
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
                    Current Amount (Optional)
                  </label>
                  <input
                    type="number"
                    name="current_amount"
                    value={formData.current_amount}
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
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="target_date"
                    value={formData.target_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="What are you saving for?"
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
                      Creating...
                    </>
                  ) : (
                    <>Create Goal</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Goals List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <Target className="h-5 w-5 text-indigo-500 mr-2" />
              Your Financial Goals
            </h2>
            <button 
              onClick={fetchGoals}
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
                <span className="ml-2 text-gray-600">Loading goals...</span>
              </div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Goals Yet</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Set financial goals to help you save for important life events and track your progress over time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map((goal) => (
                  <div key={goal.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-white flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{goal.description || "No description"}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        disabled={processingId === goal.id}
                        className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100 disabled:opacity-50"
                        title="Delete Goal"
                      >
                        {processingId === goal.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-medium text-indigo-600">
                          {calculateProgress(goal)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full" 
                          style={{ width: `${calculateProgress(goal)}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Current</p>
                          <p className="text-lg font-semibold text-gray-900">${goal.current_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Target</p>
                          <p className="text-lg font-semibold text-gray-900">${goal.target_amount.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Target Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(goal.target_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time Remaining</p>
                          <p className="text-sm font-medium text-gray-900">{getTimeRemaining(goal.target_date)}</p>
                        </div>
                      </div>
                      
                      {!goal.is_completed && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Update Progress
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              id={`update-amount-${goal.id}`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="New total amount"
                              min="0"
                              step="0.01"
                              disabled={processingId === goal.id}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`update-amount-${goal.id}`) as HTMLInputElement;
                                handleUpdateProgress(goal.id, input.value);
                              }}
                              disabled={processingId === goal.id}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                            >
                              {processingId === goal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
