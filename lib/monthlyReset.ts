import { supabase } from './supabase'
import { getCurrentMonthYear } from './utils'

export async function checkAndCreateMonthlyBudget(userId: string) {
  const { month, year } = getCurrentMonthYear()
  
  // Check if budget exists for current month
  const { data: existingBudget } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single()
  
  if (existingBudget) {
    return // Budget already exists
  }
  
  // Get previous month's budget
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  
  const { data: prevBudget } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', prevMonth)
    .eq('year', prevYear)
    .single()
  
  if (prevBudget) {
    // Copy previous month's budget to current month
    await supabase.from('budgets').insert({
      user_id: userId,
      month,
      year,
      total_budget: prevBudget.total_budget,
      category_budgets: prevBudget.category_budgets
    })
    
    // Generate summary for previous month if not exists
    await generateMonthlySummary(userId, prevMonth, prevYear)
  }
}

async function generateMonthlySummary(userId: string, month: number, year: number) {
  // Check if summary already exists
  const { data: existingSummary } = await supabase
    .from('monthly_summaries')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single()
  
  if (existingSummary) {
    return // Summary already exists
  }
  
  // Get all expenses for that month
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
  
  if (!expenses || expenses.length === 0) {
    return // No expenses to summarize
  }
  
  // Get budget for that month
  const { data: budget } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single()
  
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
  const budgetAmount = budget?.total_budget || 0
  
  // Calculate category breakdown
  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount.toString())
    return acc
  }, {} as Record<string, number>)
  
  // Determine status
  let status: 'green' | 'yellow' | 'red' = 'green'
  if (totalSpent >= budgetAmount) {
    status = 'red'
  } else if (totalSpent >= budgetAmount * 0.8) {
    status = 'yellow'
  }
  
  // Insert summary
  await supabase.from('monthly_summaries').insert({
    user_id: userId,
    month,
    year,
    total_spent: totalSpent,
    status,
    category_breakdown: categoryBreakdown
  })
}
