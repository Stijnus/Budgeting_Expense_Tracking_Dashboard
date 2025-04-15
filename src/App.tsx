import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import Categories from './components/Categories'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import CategoryPieChart from './components/CategoryPieChart'
import SpendingTrendChart from './components/SpendingTrendChart'
import type { Session } from '@supabase/supabase-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Refs to hold the refetch functions
  const refetchExpensesRef = useRef<(() => void) | null>(null);
  const refetchPieChartRef = useRef<(() => void) | null>(null); // Ref for Pie Chart
  const refetchTrendChartRef = useRef<(() => void) | null>(null); // Ref for Trend Chart

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    }).catch(error => {
      console.error("Error getting session:", error)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Callback to trigger refetches in List and Charts
  const handleExpenseAddedOrUpdated = () => {
    console.log("Triggering refetch for List and Charts...");
    if (refetchExpensesRef.current) {
      refetchExpensesRef.current();
    }
    if (refetchPieChartRef.current) {
      refetchPieChartRef.current();
    }
    if (refetchTrendChartRef.current) {
      refetchTrendChartRef.current();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        <div className="min-h-screen bg-gray-100 p-8">
          <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
            <h1 className="text-3xl font-bold text-gray-900">Budget Tracker</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Logged in as: {session.user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </header>
          <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Categories */}
            <div className="md:col-span-1">
              {/* Categories doesn't directly depend on expense changes, no refetch needed here */}
              <Categories />
            </div>

            {/* Right Column: Expenses & Insights */}
            <div className="md:col-span-2 space-y-8">
              {/* Expense Entry Form */}
              <ExpenseForm onExpenseAdded={handleExpenseAddedOrUpdated} />

              {/* Expense List */}
              <ExpenseList
                setRefetch={(refetchFn) => { refetchExpensesRef.current = refetchFn; }}
                onExpenseUpdated={handleExpenseAddedOrUpdated}
              />

              {/* Charts/Insights Section */}
              <CategoryPieChart
                setRefetch={(refetchFn) => { refetchPieChartRef.current = refetchFn; }}
              />
              <SpendingTrendChart
                setRefetch={(refetchFn) => { refetchTrendChartRef.current = refetchFn; }}
              />

            </div>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
