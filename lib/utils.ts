import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBudgetStatus(spent: number, budget: number): 'green' | 'yellow' | 'red' {
  const percentage = (spent / budget) * 100
  if (percentage >= 100) return 'red'
  if (percentage >= 80) return 'yellow'
  return 'green'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export function getCurrentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function getTodayISOString() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - (offset * 60 * 1000))
  return localDate.toISOString().split('T')[0]
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
