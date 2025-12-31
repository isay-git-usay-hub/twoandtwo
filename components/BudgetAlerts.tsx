'use client'

import { Budget, Expense } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

export default function BudgetAlerts({ budget, expenses }: { budget: Budget; expenses: Expense[] }) {
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
  const percentage = (totalSpent / budget.total_budget) * 100

  // Don't show alerts if under 50%
  if (percentage < 50) return null

  const getAlertConfig = () => {
    if (percentage >= 100) {
      return {
        icon: '🚨',
        title: 'Budget Exceeded!',
        message: `You've spent ${formatCurrency(totalSpent - budget.total_budget)} over your budget`,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      }
    } else if (percentage >= 90) {
      return {
        icon: '⚠️',
        title: 'Almost at Budget Limit',
        message: `Only ${formatCurrency(budget.total_budget - totalSpent)} remaining (${(100 - percentage).toFixed(1)}%)`,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600'
      }
    } else if (percentage >= 75) {
      return {
        icon: '⚡',
        title: 'Approaching Budget Limit',
        message: `You've used ${percentage.toFixed(0)}% of your budget`,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      }
    } else {
      return {
        icon: '💡',
        title: 'Halfway There',
        message: `You've spent ${percentage.toFixed(0)}% of your monthly budget`,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600'
      }
    }
  }

  const alert = getAlertConfig()

  return (
    <div className={`${alert.bgColor} border ${alert.borderColor} rounded-xl p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <span className={`text-2xl ${alert.iconColor}`}>{alert.icon}</span>
        <div className="flex-1">
          <h4 className={`font-semibold ${alert.textColor} mb-1`}>{alert.title}</h4>
          <p className={`text-sm ${alert.textColor}`}>{alert.message}</p>
        </div>
      </div>
    </div>
  )
}
