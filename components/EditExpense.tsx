'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserCategories } from '@/lib/useUserCategories'
import { Expense } from '@/lib/types'
import CustomSelect from './CustomSelect'
import Input from './ui/Input'
import { toast } from 'sonner'

export default function EditExpense({
  expense,
  onClose,
  onUpdate
}: {
  expense: Expense
  onClose: () => void
  onUpdate: () => void
}) {
  const { categories } = useUserCategories()
  const [amount, setAmount] = useState(expense.amount.toString())
  const [category, setCategory] = useState(expense.category)
  const [description, setDescription] = useState(expense.description || '')
  const [paymentMethod, setPaymentMethod] = useState(expense.payment_method || '')
  const [date, setDate] = useState(expense.date)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount greater than 0')
      return
    }
    if (amountNum > 10000000) {
      toast.error('Amount is too large')
      return
    }

    const expenseDate = new Date(date)
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    const oneYearAhead = new Date()
    oneYearAhead.setFullYear(today.getFullYear() + 1)

    if (expenseDate < oneYearAgo || expenseDate > oneYearAhead) {
      toast.error('Please enter a date within the last year or next year')
      return
    }

    if (!category) {
      toast.error('Please select a category')
      return
    }

    setLoading(true)

    try {
      const [yearStr, monthStr] = date.split('-')
      const month = parseInt(monthStr)
      const year = parseInt(yearStr)

      const { error } = await supabase
        .from('expenses')
        .update({
          amount: amountNum,
          category,
          description: description.trim() || null,
          payment_method: paymentMethod || null,
          date,
          month,
          year
        })
        .eq('id', expense.id)

      if (error) {
        console.error('Error updating expense:', error)
        toast.error('Failed to update expense')
        return
      }

      toast.success('Expense updated')
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold dark:text-white">Edit Expense</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Amount *"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                prefix="₹"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category *</label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={categories}
                placeholder="Select a category"
              />
            </div>

            <div>
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Payment Method</label>
              <CustomSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={['UPI', 'Cash', 'Card']}
                placeholder="Select payment method"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
