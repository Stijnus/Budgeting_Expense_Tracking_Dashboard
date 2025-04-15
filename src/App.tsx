import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import Categories from './components/Categories'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import CategoryPieChart from './components/CategoryPieChart'
import SpendingTrendChart from './components/SpendingTrendChart'
import BudgetManager from './components/BudgetManager'
import IncomeForm from './components/IncomeForm' // Import IncomeForm
import IncomeList from './components/IncomeList' // Import IncomeList
import type { Session } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Refs to hold the refetch functions
  const refetchExpensesRef = useRef<(() => void) | null>(null);
  const refetchPieChartRef = useRef<(() => void) | null>(null);
  const refetchTrendChartRef = useRef<(() => void) | null>(null);
  // Trigger for IncomeList refetch (simple approach)
  const [incomeListTrigger, setIncomeListTrigger] = useState(0);

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
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  // Callback for Expense changes
  const handleExpenseAddedOrUpdated = () => {
    console.log("Triggering refetch for List and Charts...");
    if (refetchExpensesRef.current) refetchExpensesRef.current();
    if (refetchPieChartRef.current) refetchPieChartRef.current();
    if (refetchTrendChartRef.current) refetchTrendChartRef.current(); // Expense changes affect trend chart
    // Note: Expense changes might affect budget progress, but BudgetManager fetches its own data currently.
  };

  // Callback for Income changes
  const handleIncomeAddedOrUpdated = () => {
    console.log("Triggering refetch for Income List and Trend Chart...");
    setIncomeListTrigger(prev => prev + 1); // Increment trigger to refetch IncomeList
    if (refetchTrendChartRef.current) refetchTrendChartRef.current(); // Income changes affect trend chart
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-600">
          <Loader2 className="animate-spin h-12 w-12 mb-4" />
          <p>Loading Application...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
          <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-300 gap-4 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">Budget Tracker</h1>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm text-gray-600 truncate max-w-xs text-center sm:text-left">
                Logged in as: {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
              >
                Logout
              </button>
            </div>
          </header>
          {/* Main Grid: Adjust columns for income section */}
          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Column 1: Categories & Budgets */}
            <div className="md:col-span-1 lg:col-span-1 space-y-8">
              <Categories />
              <BudgetManager />
            </div>

            {/* Column 2: Income & Expenses Forms/Lists */}
            <div className="md:col-span-1 lg:col-span-1 space-y-8">
               <IncomeForm onIncomeAdded={handleIncomeAddedOrUpdated} />
               <IncomeList triggerRefetch={incomeListTrigger} />
               <ExpenseForm onExpenseAdded={handleExpenseAddedOrUpdated} />
            </div>

            {/* Column 3: Expense List & Charts */}
            <div className="md:col-span-2 lg:col-span-1 space-y-8"> {/* Span 2 on medium, 1 on large */}
              <ExpenseList
                setRefetch={(refetchFn) => { refetchExpensesRef.current = refetchFn; }}
                onExpenseUpdated={handleExpenseAddedOrUpdated}
              />
              {/* Keep charts here, maybe stack them vertically now */}
              <div className="grid grid-cols-1 gap-8">
                <CategoryPieChart
                  setRefetch={(refetchFn) => { refetchPieChartRef.current = refetchFn; }}
                />
                <SpendingTrendChart
                  setRefetch={(refetchFn) => { refetchTrendChartRef.current = refetchFn; }}
                />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
