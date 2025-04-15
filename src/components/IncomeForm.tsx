// src/components/IncomeForm.tsx
import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';
import { Loader2, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';

type IncomeInsert = Database['public']['Tables']['incomes']['Insert'];

interface IncomeFormProps {
  onIncomeAdded: () => void; // Callback to notify parent (e.g., IncomeList)
}

export default function IncomeForm({ onIncomeAdded }: IncomeFormProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!incomeDate) {
      setError('Please select a date.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('User not found');

      const incomeData: IncomeInsert = {
        user_id: user.id,
        amount: parsedAmount,
        description: description.trim() || null, // Store null if empty
        income_date: incomeDate,
      };

      const { error: insertError } = await supabase.from('incomes').insert(incomeData);

      if (insertError) throw insertError;

      // Reset form and show success
      setAmount('');
      setDescription('');
      setIncomeDate(new Date().toISOString().split('T')[0]); // Reset date to today
      setSuccessMessage('Income added successfully!');
      onIncomeAdded(); // Notify parent component
      descriptionInputRef.current?.focus(); // Focus description for next entry

      // Clear success message after a few seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error: any) {
      console.error('Error adding income:', error);
      setError(`Failed to add income: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <DollarSign size={20} className="text-green-600" /> Add New Income
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description */}
        <div>
          <label htmlFor="income-description" className="block text-sm font-medium text-gray-700">
            Description / Source
          </label>
          <input
            ref={descriptionInputRef}
            type="text"
            id="income-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
            placeholder="e.g., Salary, Freelance"
            maxLength={200}
            disabled={loading}
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="income-amount" className="block text-sm font-medium text-gray-700">
            Amount *
          </label>
          <input
            type="number"
            id="income-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            disabled={loading}
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="income-date" className="block text-sm font-medium text-gray-700">
            Date Received *
          </label>
          <input
            type="date"
            id="income-date"
            value={incomeDate}
            onChange={(e) => setIncomeDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
            required
            disabled={loading}
          />
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

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            {loading ? 'Adding...' : 'Add Income'}
          </button>
        </div>
      </form>
    </div>
  );
}
