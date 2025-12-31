'use client'

import { useState } from 'react'
import { Expense } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import EditExpense from './EditExpense'
import { toast } from 'sonner'
import ConfirmModal from './ui/ConfirmModal'
import { motion, AnimatePresence } from 'framer-motion'

export default function ExpenseList({
  expenses,
  onUpdate,
  hasMore,
  onLoadMore
}: {
  expenses: Expense[];
  onUpdate: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', deleteId)

      if (error) {
        console.error('Error deleting expense:', error)
        toast.error('Failed to delete expense')
        return
      }

      toast.success('Expense deleted')
      onUpdate()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm">
      <h3 className="text-xl font-bold mb-4 dark:text-white">Recent Expenses</h3>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No expenses yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add your first expense to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {expenses.slice(0, 10).map((expense) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium dark:text-white">{expense.category}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {expense.payment_method || 'N/A'}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{expense.description}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg dark:text-white">{formatCurrency(parseFloat(expense.amount.toString()))}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                      title="Edit expense"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteId(expense.id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                      title="Delete expense"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMore && (
            <button
              onClick={onLoadMore}
              className="w-full py-3 mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Load More Expenses
            </button>
          )}
        </div>
      )}

      {editingExpense && (
        <EditExpense
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onUpdate={() => {
            setEditingExpense(null)
            onUpdate()
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        isDangerous
      />
    </div>
  )
}
