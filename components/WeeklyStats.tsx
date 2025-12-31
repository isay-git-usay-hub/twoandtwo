'use client'

import { Expense, CATEGORIES } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { format, subDays } from 'date-fns'

export default function WeeklyStats({ expenses }: { expenses: Expense[] }) {
  // Get expenses from last 7 days
  const today = new Date()
  const offset = today.getTimezoneOffset()
  const localToday = new Date(today.getTime() - (offset * 60 * 1000))

  const sevenDaysAgo = new Date(localToday)
  sevenDaysAgo.setDate(localToday.getDate() - 6)

  const weekExpenses = expenses.filter(exp => {
    const expDate = exp.date // ISO string YYYY-MM-DD
    return expDate >= sevenDaysAgo.toISOString().split('T')[0] && expDate <= localToday.toISOString().split('T')[0]
  })

  const weekTotal = weekExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)

  // Get top category
  // Dynamically extract all unique categories from expenses to ensure we catch everything
  const allCategories = Array.from(new Set(expenses.map(e => e.category)))

  const categoryTotals = allCategories.map(cat => ({
    category: cat,
    total: weekExpenses
      .filter(e => e.category === cat)
      .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
  }))

  const topCategory = categoryTotals.length > 0
    ? categoryTotals.reduce((max, cat) => cat.total > max.total ? cat : max, categoryTotals[0])
    : { category: 'N/A', total: 0 }

  // Compare with previous week
  const fourteenDaysAgo = new Date(localToday)
  fourteenDaysAgo.setDate(localToday.getDate() - 13)

  const prevWeekExpenses = expenses.filter(exp => {
    const expDate = exp.date
    return expDate >= fourteenDaysAgo.toISOString().split('T')[0] && expDate < sevenDaysAgo.toISOString().split('T')[0]
  })

  const prevWeekTotal = prevWeekExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)

  let weekChange = 0
  let isFirstWeek = false
  if (prevWeekTotal > 0) {
    weekChange = ((weekTotal - prevWeekTotal) / prevWeekTotal) * 100
  } else if (weekTotal > 0) {
    isFirstWeek = true
    weekChange = 0 // Don't show percentage when comparing to zero
  }

  if (weekExpenses.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg mb-6">
      <h3 className="text-lg font-semibold mb-4 opacity-90">This Week's Summary</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm opacity-80">Total Spent</p>
          <p className="text-2xl font-bold">{formatCurrency(weekTotal)}</p>
        </div>

        <div>
          <p className="text-sm opacity-80">Transactions</p>
          <p className="text-2xl font-bold">{weekExpenses.length}</p>
        </div>

        <div>
          <p className="text-sm opacity-80">Top Category</p>
          <p className="text-2xl font-bold">{topCategory.category}</p>
          <p className="text-xs opacity-80">{formatCurrency(topCategory.total)}</p>
        </div>

        <div>
          <p className="text-sm opacity-80">vs Last Week</p>
          {isFirstWeek ? (
            <>
              <p className="text-2xl font-bold text-white">New</p>
              <p className="text-xs opacity-80">First week with expenses</p>
            </>
          ) : (
            <>
              <p className={`text-2xl font-bold ${weekChange > 0 ? 'text-red-200' : weekChange < 0 ? 'text-green-200' : 'text-white'}`}>
                {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)}%
              </p>
              <p className="text-xs opacity-80">
                {weekChange > 0 ? 'Spent more' : weekChange < 0 ? 'Spent less' : 'Same as last week'}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-xs opacity-80">
          Period: {format(sevenDaysAgo, 'MMM dd')} - {format(localToday, 'MMM dd, yyyy')}
        </p>
      </div>
    </div>
  )
}
