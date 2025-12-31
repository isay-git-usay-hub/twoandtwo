'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useTheme } from '@/lib/themeStore'
import { Budget, Expense } from '@/lib/types'
import { getCurrentMonthYear } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from './ui/Skeleton'
import MobileNav from './MobileNav'
import BudgetSetup from './BudgetSetup'
import AddExpense from './AddExpense'
import ExpenseList from './ExpenseList'
import BudgetOverview from './BudgetOverview'
import Reports from './Reports'
import Profile from './Profile'
import WeeklyStats from './WeeklyStats'
import BudgetAlerts from './BudgetAlerts'
import CategoryManager from './CategoryManager'
import EditBudget from './EditBudget'

export default function Dashboard() {
  const { user, setUser } = useStore()
  const { isDark, toggleTheme, initTheme } = useTheme()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'profile'>('dashboard')
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showEditBudget, setShowEditBudget] = useState(false)

  useEffect(() => {
    initTheme()
  }, [])

  useEffect(() => {
    if (user) {
      checkMonthlyReset()
    }
  }, [user])

  const checkMonthlyReset = async () => {
    if (!user) return
    const { checkAndCreateMonthlyBudget } = await import('@/lib/monthlyReset')
    await checkAndCreateMonthlyBudget(user.id)
    loadData()
  }

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const ITEMS_PER_PAGE = 20

  const loadData = async (reset = false) => {
    if (!user) return

    try {
      const { month, year } = getCurrentMonthYear()

      // Load budget only on initial load or reset
      if (reset || !budget) {
        const { data: budgetData } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', month)
          .eq('year', year)
          .single()

        if (budgetData) setBudget(budgetData)
      }

      const currentPage = reset ? 0 : page
      const from = currentPage * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data: expensesData, error: expensesError, count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .order('date', { ascending: false })
        .range(from, to)

      if (expensesError) throw expensesError

      if (reset) {
        setExpenses(expensesData || [])
        setPage(1)
      } else {
        setExpenses(prev => {
          const newExpenses = expensesData || []
          // Create a map of existing expenses by ID to prevent duplicates
          const existingIds = new Set(prev.map(e => e.id))
          const uniqueNewExpenses = newExpenses.filter(e => !existingIds.has(e.id))
          return [...prev, ...uniqueNewExpenses]
        })
        setPage(prev => prev + 1)
      }

      setHasMore(count ? from + (expensesData?.length || 0) < count : false)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!budget) {
    return <BudgetSetup onComplete={loadData} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 md:pb-0">
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">two&two</h1>
          <div className="flex gap-3">
            <button
              onClick={() => toggleTheme()}
              className="text-lg px-3 py-1 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              title="Toggle dark mode"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="hidden md:flex text-sm px-3 py-1 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors items-center gap-1"
              title="Manage categories"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Categories
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="hidden md:flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            Profile
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <BudgetAlerts budget={budget} expenses={expenses} />
              <WeeklyStats expenses={expenses} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                  <BudgetOverview budget={budget} expenses={expenses} onEditBudget={() => setShowEditBudget(true)} />
                  <ExpenseList
                    expenses={expenses}
                    onUpdate={() => loadData(true)}
                    hasMore={hasMore}
                    onLoadMore={() => loadData(false)}
                  />
                </div>
                <div className="hidden lg:block">
                  <AddExpense budget={budget} onAdd={() => loadData(true)} />
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'reports' ? (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Reports />
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Profile />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={() => setShowAddExpense(true)}
        onSettingsClick={() => setShowCategoryManager(true)}
      />

      {/* Mobile Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddExpense(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold dark:text-white">Add Expense</h3>
                <button onClick={() => setShowAddExpense(false)} className="text-gray-500">✕</button>
              </div>
              <div className="p-4">
                <AddExpense budget={budget} onAdd={() => {
                  loadData()
                  setShowAddExpense(false)
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}

      {showEditBudget && budget && (
        <EditBudget 
          budget={budget} 
          onClose={() => setShowEditBudget(false)} 
          onUpdate={loadData} 
        />
      )}
    </div>
  )
}
