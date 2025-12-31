'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useUserCategories } from '@/lib/useUserCategories'
import { getCurrentMonthYear } from '@/lib/utils'
import Input from './ui/Input'
import { toast } from 'sonner'

export default function BudgetSetup({ onComplete }: { onComplete: () => void }) {
  const { user } = useStore()
  const { categories } = useUserCategories()
  const [totalBudget, setTotalBudget] = useState('')
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validation
    const budgetNum = parseFloat(totalBudget)
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast.error('Please enter a valid budget amount greater than 0')
      return
    }
    if (budgetNum > 100000000) {
      toast.error('Budget amount is too large')
      return
    }

    // Validate category budgets
    const categoryBudgetValues = Object.values(categoryBudgets).filter(v => v)
    const totalCategoryBudget = categoryBudgetValues.reduce((sum, val) => sum + parseFloat(val), 0)

    if (totalCategoryBudget > budgetNum) {
      toast.error('Total category budgets cannot exceed your total budget')
      return
    }

    setLoading(true)

    try {
      const { month, year } = getCurrentMonthYear()

      const budgetData = {
        user_id: user.id,
        month,
        year,
        total_budget: budgetNum,
        category_budgets: Object.entries(categoryBudgets).reduce((acc, [key, val]) => {
          if (val && parseFloat(val) > 0) acc[key] = parseFloat(val)
          return acc
        }, {} as Record<string, number>)
      }

      const { error } = await supabase.from('budgets').insert(budgetData)

      if (error) {
        console.error('Error creating budget:', error)
        toast.error('Failed to create budget')
        return
      }

      toast.success('Budget set successfully')
      onComplete()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-2 dark:text-white">Set Your Monthly Budget</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Let's start by setting up your budget for this month</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label="Total Monthly Budget *"
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="50000"
              required
              prefix="₹"
              className="text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 dark:text-gray-300">Category Budgets (Optional)</label>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <div key={category}>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{category}</label>
                  <Input
                    type="number"
                    value={categoryBudgets[category] || ''}
                    onChange={(e) => setCategoryBudgets({ ...categoryBudgets, [category]: e.target.value })}
                    placeholder="0"
                    prefix="₹"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-lg"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
