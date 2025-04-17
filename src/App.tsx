import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import Categories from './components/Categories'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import CategoryPieChart from './components/CategoryPieChart'
import SpendingTrendChart from './components/SpendingTrendChart'
import BudgetManager from './components/BudgetManager'
import IncomeForm from './components/IncomeForm'
import IncomeList from './components/IncomeList'
import MonthlyReport from './components/MonthlyReport'
import SettingsPage from './pages/SettingsPage'
import AppLayout from './components/layout/AppLayout' // Import the layout wrapper
import type { Session } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react';

type View = 'dashboard' | 'settings';

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Refs for dashboard components (remain unchanged)
  const refetchExpensesRef = useRef<(() => void) | null>(null);
  const refetchPieChartRef = useRef<(() => void) | null>(null);
  const refetchTrendChartRef = useRef<(() => void) | null>(null);
  const [incomeListTrigger, setIncomeListTrigger] = useState(0);

  useEffect(() => {
    setLoading(true); // Start loading when checking session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    }).catch(error => {
      console.error("Error getting session:", error)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) { // If logged out, reset view
          setCurrentView('dashboard');
      }
      setLoading(false); // Stop loading on auth change
    })

    return () => subscription?.unsubscribe()
  }, [])

  // Navigation handler passed to layout components
  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  // Callbacks for dashboard updates (remain unchanged)
  const handleExpenseAddedOrUpdated = () => {
    console.log("Triggering refetch for List and Charts...");
    if (refetchExpensesRef.current) refetchExpensesRef.current();
    if (refetchPieChartRef.current) refetchPieChartRef.current();
    if (refetchTrendChartRef.current) refetchTrendChartRef.current();
  };
  const handleIncomeAddedOrUpdated = () => {
    console.log("Triggering refetch for Income List and Trend Chart...");
    setIncomeListTrigger(prev => prev + 1);
    if (refetchTrendChartRef.current) refetchTrendChartRef.current();
  };

  // Initial Loading State (Full Screen)
  if (loading && session === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-600">
          <Loader2 className="animate-spin h-12 w-12 mb-4" />
          <p>Loading Application...</p>
        </div>
      </div>
    )
  }

  // Authentication Screen
  if (!session) {
    return <Auth />;
  }

  // Main Application with Layout
  return (
    <AppLayout
        session={session}
        currentView={currentView}
        onNavigate={handleNavigate}
        loading={loading} // Pass loading state for disabling buttons etc.
    >
        {/* Render content based on currentView */}
        {loading && ( // Subtle loader within the layout when navigating/refreshing
            <div className="p-8 text-center text-gray-500">
                <Loader2 className="animate-spin h-8 w-8 inline-block" />
                <p>Loading...</p>
            </div>
        )}

        {!loading && currentView === 'dashboard' && (
            <div className="p-4 sm:p-8">
                {/* Main Grid for Dashboard */}
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Categories, Budgets */}
                    <div className="lg:col-span-1 space-y-8">
                        <Categories />
                        <BudgetManager />
                    </div>
                    {/* Column 2: Income & Expenses Forms/Lists */}
                    <div className="lg:col-span-1 space-y-8">
                        <IncomeForm onIncomeAdded={handleIncomeAddedOrUpdated} />
                        <IncomeList triggerRefetch={incomeListTrigger} />
                        <ExpenseForm onExpenseAdded={handleExpenseAddedOrUpdated} />
                        <MonthlyReport />
                    </div>
                    {/* Column 3: Expense List & Charts */}
                    <div className="lg:col-span-1 space-y-8">
                        <ExpenseList
                            setRefetch={(refetchFn) => { refetchExpensesRef.current = refetchFn; }}
                            onExpenseUpdated={handleExpenseAddedOrUpdated}
                        />
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

        {!loading && currentView === 'settings' && (
            <SettingsPage />
        )}
    </AppLayout>
  )
}

export default App
