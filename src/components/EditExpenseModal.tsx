// src/components/EditExpenseModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';
import { X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'; // Icons

type Expense = Database['public']['Tables']['expenses']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  expense: Expense | null;
  categories: Category[]; // Receive categories as prop
}

export default function EditExpenseModal({
  isOpen,
  onClose,
  onSave,
  expense,
  categories, // Use passed categories
}: EditExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Effect to populate form when the expense prop is available and modal opens
  useEffect(() => {
    if (expense && isOpen) {
      setDescription(expense.description || '');
      setAmount(String(expense.amount)); // Keep as string for input
      setExpenseDate(expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : '');
      setSelectedCategoryId(expense.category_id);
      setError(null);
      setSuccessMessage(null);
    }
    // Reset form state when modal closes or expense becomes null
    if (!isOpen) {
        // Optional: Explicitly clear fields if desired, though useEffect above handles repopulation
        // setDescription(''); setAmount(''); setExpenseDate(''); setSelectedCategoryId(null);
    }
  }, [expense, isOpen]);


  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!expense) return;

    setError(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!expenseDate) {
      setError('Please select a date.');
      return;
    }

    setLoading(true);

    try {
      const updatedData = {
        amount: parsedAmount,
        description: description.trim(),
        expense_date: expenseDate,
        category_id: selectedCategoryId || null,
      };

      const { error: updateError } = await supabase
        .from('expenses')
        .update(updatedData)
        .eq('id', expense.id);

      if (updateError) throw updateError;

      setSuccessMessage('Expense updated successfully!');
      onSave(); // Trigger refetch in parent

      setTimeout(() => {
        onClose(); // Close the modal after showing success
      }, 1500);

    } catch (error: any) {
      console.error('Error updating expense:', error);
      setError(`Failed to update expense: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !expense) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleOverlayClick}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 relative transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 id="modal-title" className="text-xl font-semibold mb-4 text-gray-800">Edit Expense</h2>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="e.g., Coffee, Lunch"
              maxLength={200}
              disabled={loading}
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700">
              Amount *
            </label>
            <input
              type="number"
              id="edit-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              disabled={loading}
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="edit-expenseDate" className="block text-sm font-medium text-gray-700">
              Date *
            </label>
            <input
              type="date"
              id="edit-expenseDate"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
              disabled={loading}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="edit-category"
              value={selectedCategoryId ?? ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
              disabled={loading || categories.length === 0}
            >
              <option value="">-- Select Category (Optional) --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
             {categories.length === 0 && !loading && (
               <p className="mt-1 text-xs text-gray-500">No categories available.</p>
             )}
          </div>

          {/* Feedback Messages */}
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle size={16} /> {error}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle size={16} /> {successMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center min-w-[110px]" // Min width to prevent size change
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
