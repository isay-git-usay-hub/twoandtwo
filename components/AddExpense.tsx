'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useUserCategories } from '@/lib/useUserCategories'
import { Budget } from '@/lib/types'
import CustomSelect from './CustomSelect'
import Input from './ui/Input'
import { toast } from 'sonner'
import { getTodayISOString } from '@/lib/utils'

export default function AddExpense({ budget, onAdd }: { budget: Budget; onAdd: () => void }) {
  const { user } = useStore()
  const { categories } = useUserCategories()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0])
    }
  }, [categories, category])
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [date, setDate] = useState(getTodayISOString())
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

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

      const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
        amount: amountNum,
        category,
        description: description.trim() || null,
        payment_method: paymentMethod || null,
        date: date,
        month,
        year
      })

      if (error) {
        console.error('Error adding expense:', error)
        toast.error('Failed to add expense')
        return
      }

      toast.success('Expense added successfully')
      setAmount('')
      setDescription('')
      setPaymentMethod('')
      setDate(getTodayISOString())
      onAdd()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm">
      <h3 className="text-xl font-bold mb-4 dark:text-white">Add Expense</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Amount *"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            min="0.01"
            max="10000000"
            step="0.01"
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
            max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
            required
          />
        </div>

        <div>
          <Input
            label="Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lunch at cafe"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  )
}
