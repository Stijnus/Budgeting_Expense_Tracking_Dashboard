import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import Categories from './components/Categories'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import CategoryPieChart from './components/CategoryPieChart'
import SpendingTrendChart from './components/SpendingTrendChart'
import type { Session } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'; // Import loader icon

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
    setLoading(true); // Show loading indicator during logout
    try {
      await supabase.auth.signOut();
      // Session state will be updated by onAuthStateChange listener
    } catch (error) {
      console.error("Error logging out:", error);
      // Optionally show an error message to the user
    } finally {
      // No need to setLoading(false) here as the component will re-render
      // based on the session change triggered by onAuthStateChange
    }
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
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8"> {/* Added responsive padding */}
          <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-300 gap-4 sm:gap-0"> {/* Responsive flex layout and gap */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">Budget Tracker</h1> {/* Responsive text size */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4"> {/* Responsive layout and spacing */}
              <span className="text-sm text-gray-600 truncate max-w-xs text-center sm:text-left"> {/* Truncate long emails */}
                Logged in as: {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto" // Responsive width
              >
                Logout
              </button>
            </div>
          </header>
          {/* Use grid layout, stack on mobile, two columns on medium screens, three on large */}
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Categories & Expense Form (stack on mobile/medium) */}
            <div className="lg:col-span-1 space-y-8">
              <Categories />
              <ExpenseForm onExpenseAdded={handleExpenseAddedOrUpdated} />
            </div>

            {/* Right Column: Expenses List & Charts (takes full width on mobile, 2/3 on large) */}
            <div className="lg:col-span-2 space-y-8">
              <ExpenseList
                setRefetch={(refetchFn) => { refetchExpensesRef.current = refetchFn; }}
                onExpenseUpdated={handleExpenseAddedOrUpdated}
              />
              {/* Charts side-by-side on medium screens and up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
