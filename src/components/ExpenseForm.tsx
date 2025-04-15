import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'

type Category = Database['public']['Tables']['categories']['Row']

interface ExpenseFormProps {
  onExpenseAdded: () => void // Callback to notify parent when an expense is added
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]) // Default to today
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch categories for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user) throw sessionError || new Error('User not logged in')

        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', session.user.id)
          .order('name', { ascending: true })

        if (error) throw error
        setCategories(data || [])
        // Optionally set a default category if needed
        // if (data && data.length > 0) {
        //   setSelectedCategoryId(data[0].id);
        // }
      } catch (error: any) {
        console.error('Error fetching categories for form:', error)
        setError('Could not load categories.')
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount.')
      return
    }
    if (!expenseDate) {
      setError('Please select a date.')
      return
    }

    setLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError || new Error('User not found')

      const expenseData = {
        user_id: user.id,
        amount: parseFloat(amount),
        description: description.trim(),
        expense_date: expenseDate,
        category_id: selectedCategoryId || null, // Use null if no category selected
      }

      const { error: insertError } = await supabase.from('expenses').insert(expenseData)

      if (insertError) throw insertError

      // Reset form and show success
      setAmount('')
      setDescription('')
      setSelectedCategoryId(null)
      // Keep date as is or reset to today? setExpenseDate(new Date().toISOString().split('T')[0]);
      setSuccessMessage('Expense added successfully!')
      onExpenseAdded() // Notify parent component

      // Clear success message after a few seconds
      setTimeout(() => setSuccessMessage(null), 3000)

    } catch (error: any) {
      console.error('Error adding expense:', error)
      setError(`Failed to add expense: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Coffee, Lunch"
            maxLength={200} // Optional: Add a max length
            disabled={loading}
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount *
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            disabled={loading}
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700">
            Date *
          </label>
          <input
            type="date"
            id="expenseDate"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
            disabled={loading}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            value={selectedCategoryId ?? ''}
            onChange={(e) => setSelectedCategoryId(e.target.value || null)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
             <p className="mt-1 text-xs text-gray-500">No categories found. Add some in the Categories section!</p>
          )}
        </div>

        {/* Feedback Messages */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}
