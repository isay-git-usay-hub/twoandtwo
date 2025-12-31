'use client'

import { Budget, Expense } from '@/lib/types'
import { formatCurrency, getBudgetStatus } from '@/lib/utils'
import { useUserCategories } from '@/lib/useUserCategories'

export default function BudgetOverview({ 
  budget, 
  expenses, 
  onEditBudget 
}: { 
  budget: Budget; 
  expenses: Expense[];
  onEditBudget?: () => void;
}) {
  const { categories: CATEGORIES } = useUserCategories()
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
  const remaining = budget.total_budget - totalSpent
  const percentage = (totalSpent / budget.total_budget) * 100
  const status = getBudgetStatus(totalSpent, budget.total_budget)

  const categorySpending = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses
      .filter(exp => exp.category === cat)
      .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
    return acc
  }, {} as Record<string, number>)

  const statusColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white">Monthly Overview</h3>
          {onEditBudget && (
            <button
              onClick={onEditBudget}
              className="text-sm px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1"
              title="Edit budget"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Budget
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
            <p className="text-2xl font-bold dark:text-white">{formatCurrency(budget.total_budget)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
            <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
            <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1 dark:text-gray-300">
            <span>Progress</span>
            <span>{percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${statusColors[status]} transition-all`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold mb-4 dark:text-white">Category Breakdown</h3>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const spent = categorySpending[cat]
            const catBudget = budget.category_budgets[cat]
            const catPercentage = catBudget ? (spent / catBudget) * 100 : 0

            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium dark:text-gray-300">{cat}</span>
                  <span className="dark:text-gray-300">
                    {formatCurrency(spent)}
                    {catBudget && ` / ${formatCurrency(catBudget)}`}
                  </span>
                </div>
                {catBudget && (
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        catPercentage >= 100 ? 'bg-red-500' : catPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(catPercentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
