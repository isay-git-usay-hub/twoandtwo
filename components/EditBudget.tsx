'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { Budget } from '@/lib/types'
import { useUserCategories } from '@/lib/useUserCategories'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Input from './ui/Input'

export default function EditBudget({
  budget,
  onClose,
  onUpdate
}: {
  budget: Budget;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { user } = useStore()
  const { categories } = useUserCategories()
  const [totalBudget, setTotalBudget] = useState(budget.total_budget.toString())
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(budget.category_budgets).map(([k, v]) => [k, v.toString()])
    )
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const totalBudgetNum = parseFloat(totalBudget)
    if (isNaN(totalBudgetNum) || totalBudgetNum <= 0) {
      toast.error('Please enter a valid budget amount')
      return
    }

    setLoading(true)

    try {
      const categoryBudgetsNum = Object.fromEntries(
        Object.entries(categoryBudgets)
          .filter(([_, v]) => v && parseFloat(v) > 0)
          .map(([k, v]) => [k, parseFloat(v)])
      )

      const { error } = await supabase
        .from('budgets')
        .update({
          total_budget: totalBudgetNum,
          category_budgets: categoryBudgetsNum
        })
        .eq('id', budget.id)

      if (error) {
        console.error('Error updating budget:', error)
        toast.error('Failed to update budget')
        return
      }

      toast.success('Budget updated successfully')
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 md:p-6 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold dark:text-white">Edit Budget</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div>
            <Input
              label="Total Monthly Budget *"
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="50000"
              min="1"
              step="0.01"
              required
              prefix="₹"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This will be your spending limit for this month
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 dark:text-white">Category Budgets (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <Input
                  key={cat}
                  label={cat}
                  type="number"
                  value={categoryBudgets[cat] || ''}
                  onChange={(e) => setCategoryBudgets({ ...categoryBudgets, [cat]: e.target.value })}
                  placeholder="5000"
                  min="0"
                  step="0.01"
                  prefix="₹"
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? 'Updating...' : 'Update Budget'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
