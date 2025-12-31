export interface Budget {
  id: string
  user_id: string
  month: number
  year: number
  total_budget: number
  category_budgets: Record<string, number>
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  category: string
  description?: string
  date: string
  payment_method?: string
  month: number
  year: number
}

export interface MonthlySummary {
  id: string
  user_id: string
  month: number
  year: number
  total_spent: number
  status: 'green' | 'yellow' | 'red'
  category_breakdown: Record<string, number>
}

export const DEFAULT_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Health',
  'Misc'
]

// For backward compatibility
export const CATEGORIES = DEFAULT_CATEGORIES

export interface UserSettings {
  id: string
  user_id: string
  categories: string[]
  created_at: string
  updated_at: string
}
