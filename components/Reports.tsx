'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useUserCategories } from '@/lib/useUserCategories'
import { Expense, MonthlySummary, CATEGORIES } from '@/lib/types'
import { formatCurrency, getCurrentMonthYear } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns'
import { Skeleton } from './ui/Skeleton'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
        <p className="font-semibold dark:text-white mb-1">{label}</p>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export default function Reports() {
  const { user } = useStore()
  const { categories } = useUserCategories()
  const [weeklyData, setWeeklyData] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any>(null)
  const [yearlyData, setYearlyData] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    loadReports()
  }, [user, categories])

  const loadReports = async () => {
    if (!user) return

    const { month, year } = getCurrentMonthYear()

    // Weekly Report - last 7 days including today
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6) // Last 7 days including today

    const { data: weekExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', format(sevenDaysAgo, 'yyyy-MM-dd'))
      .lte('date', format(today, 'yyyy-MM-dd'))

    const weekTotal = weekExpenses?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0
    const weekByCategory = categories.map(cat => ({
      name: cat,
      value: weekExpenses?.filter(e => e.category === cat).reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0
    })).filter(item => item.value > 0)

    const topCategory = weekByCategory.length > 0
      ? weekByCategory.reduce((max, cat) => cat.value > max.value ? cat : max, weekByCategory[0])
      : { name: 'N/A', value: 0 }

    setWeeklyData({ total: weekTotal, byCategory: weekByCategory, topCategory: topCategory.name })

    // Monthly Report
    const { data: monthExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)

    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .single()

    const monthTotal = monthExpenses?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0
    const monthByCategory = categories.map(cat => ({
      name: cat,
      value: monthExpenses?.filter(e => e.category === cat).reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0
    })).filter(item => item.value > 0)

    // Calculate week by week breakdown
    const weeklyBreakdown = []
    const daysInMonth = new Date(year, month, 0).getDate()

    // Initialize 5 weeks
    const weeks = [
      { id: 1, start: 1, end: 7, total: 0, count: 0 },
      { id: 2, start: 8, end: 14, total: 0, count: 0 },
      { id: 3, start: 15, end: 21, total: 0, count: 0 },
      { id: 4, start: 22, end: 28, total: 0, count: 0 },
      { id: 5, start: 29, end: daysInMonth, total: 0, count: 0 }
    ]

    monthExpenses?.forEach(exp => {
      // Parse YYYY-MM-DD manually to avoid timezone issues
      let day: number
      
      if (typeof exp.date === 'string') {
        const parts = exp.date.split('-')
        day = parts.length === 3 ? parseInt(parts[2], 10) : new Date(exp.date).getDate()
      } else {
        // If it's already a Date object
        day = new Date(exp.date).getDate()
      }

      const weekIndex = weeks.findIndex(w => day >= w.start && day <= w.end)
      if (weekIndex !== -1) {
        weeks[weekIndex].total += parseFloat(exp.amount.toString())
        weeks[weekIndex].count += 1
      }
    })

    const activeWeeks = weeks.filter(w => w.total > 0 || w.count > 0).map(w => ({
      week: w.id,
      total: w.total,
      count: w.count,
      range: `${w.start}-${w.end}`
    }))

    setMonthlyData({
      total: monthTotal,
      budget: budget?.total_budget || 0,
      byCategory: monthByCategory,
      weeklyBreakdown: activeWeeks,
      status: monthTotal > (budget?.total_budget || 0) ? 'red' : monthTotal > (budget?.total_budget || 0) * 0.8 ? 'yellow' : 'green'
    })

    // Yearly Report
    const { data: summaries } = await supabase
      .from('monthly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .order('month')

    // Include current month data even if not in summaries yet
    const currentMonthSummary: MonthlySummary = {
      id: 'current',
      user_id: user.id,
      month,
      year,
      total_spent: monthTotal,
      status: monthlyData?.status || 'green',
      category_breakdown: {}
    }

    // Merge summaries with current month, avoiding duplicates
    const allMonths = [...(summaries || [])]
    const hasCurrentMonth = allMonths.some(s => s.month === month && s.year === year)
    if (!hasCurrentMonth && monthTotal > 0) {
      allMonths.push(currentMonthSummary)
      allMonths.sort((a, b) => a.month - b.month)
    }

    setYearlyData(allMonths)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Report Tabs */}
      <div className="flex gap-2 mb-6 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
        {(['weekly', 'monthly', 'yearly'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveReport(tab)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all capitalize ${activeReport === tab
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Weekly Report */}
      {activeReport === 'weekly' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-bold mb-6 dark:text-white">Weekly Report</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Spent</p>
              <p className="text-2xl font-bold dark:text-white">{formatCurrency(weeklyData?.total || 0)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Top Category</p>
              <p className="text-xl font-bold dark:text-white truncate">{weeklyData?.topCategory || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Transactions</p>
              <p className="text-2xl font-bold dark:text-white">{weeklyData?.byCategory.reduce((sum: number, cat: any) => sum + (cat.value > 0 ? 1 : 0), 0)}</p>
            </div>
          </div>

          {weeklyData?.byCategory.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData?.byCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No data available for this week
            </div>
          )}
        </div>
      )}

      {/* Monthly Report */}
      {activeReport === 'monthly' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-bold mb-6 dark:text-white">Monthly Report</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Budget</p>
              <p className="text-2xl font-bold dark:text-white">{formatCurrency(monthlyData?.budget || 0)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Spent</p>
              <p className="text-2xl font-bold dark:text-white">{formatCurrency(monthlyData?.total || 0)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Status</p>
              <div className={`inline-block px-2 py-1 rounded text-sm font-bold ${monthlyData?.status === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                monthlyData?.status === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {monthlyData?.status === 'green' ? 'Under Budget' :
                  monthlyData?.status === 'yellow' ? 'Near Budget' : 'Over Budget'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Donut Chart */}
            <div className="h-[300px] w-full">
              <h4 className="font-semibold mb-4 dark:text-gray-300 text-center">Category Breakdown</h4>
              {monthlyData?.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyData?.byCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {monthlyData?.byCategory.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No spending data yet
                </div>
              )}
            </div>

            {/* Week by Week Breakdown */}
            <div>
              <h4 className="font-semibold mb-4 dark:text-gray-300">Weekly Spending</h4>
              <div className="space-y-3">
                {monthlyData?.weeklyBreakdown && monthlyData.weeklyBreakdown.length > 0 ? (
                  monthlyData.weeklyBreakdown.map((week: any) => (
                    <div key={week.week} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium dark:text-white">Week {week.week}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Days {week.range} • {week.count} transactions</p>
                      </div>
                      <p className="font-bold dark:text-white">{formatCurrency(week.total)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No weekly data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yearly Report */}
      {activeReport === 'yearly' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-bold mb-2 dark:text-white">Yearly Report - {currentYear}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Track your spending patterns across all months of the year
          </p>
          {yearlyData.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">No yearly data yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Monthly summaries are generated automatically at the end of each month
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Months Tracked</p>
                  <p className="text-2xl font-bold dark:text-white">{yearlyData.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Spent</p>
                  <p className="text-2xl font-bold dark:text-white">
                    {formatCurrency(yearlyData.reduce((sum, m) => sum + parseFloat(m.total_spent.toString()), 0))}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Average/Month</p>
                  <p className="text-2xl font-bold dark:text-white">
                    {formatCurrency(yearlyData.reduce((sum, m) => sum + parseFloat(m.total_spent.toString()), 0) / yearlyData.length)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Budget Status</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                      ✓ {yearlyData.filter(m => m.status === 'green').length}
                    </span>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                      ⚠ {yearlyData.filter(m => m.status === 'yellow').length}
                    </span>
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                      ✗ {yearlyData.filter(m => m.status === 'red').length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData.map(m => ({
                    ...m,
                    monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m.month - 1]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                    <XAxis
                      dataKey="monthName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
                              <p className="font-semibold dark:text-white">{data.monthName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Spent: {formatCurrency(data.total_spent)}</p>
                              <p className={`text-xs mt-1 px-2 py-1 rounded inline-block ${data.status === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                data.status === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {data.status === 'green' ? 'Under Budget' :
                                  data.status === 'yellow' ? 'Near Budget' : 'Over Budget'}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="total_spent" radius={[4, 4, 0, 0]} barSize={40}>
                      {yearlyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === 'green' ? '#10b981' :
                              entry.status === 'yellow' ? '#f59e0b' : '#ef4444'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
