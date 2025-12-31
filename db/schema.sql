-- Two&Two Complete Database Schema
-- Run this entire script in the Supabase SQL Editor to set up the project.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Note: You must also enable "pg_cron" manually in the Supabase Dashboard > Database > Extensions if you want automated monthly summaries.

-- 2. Core Tables

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_budget DECIMAL(10, 2) NOT NULL,
  category_budgets JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(20),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly Summaries Table
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_spent DECIMAL(10, 2) NOT NULL,
  status VARCHAR(10) NOT NULL,
  category_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- User Settings Table (Custom Categories)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  categories TEXT[] NOT NULL DEFAULT ARRAY['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Misc'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_month_year ON expenses(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_summaries_user_year ON monthly_summaries(user_id, year);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 4. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Budgets Policies
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Monthly Summaries Policies
CREATE POLICY "Users can view own summaries" ON monthly_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON monthly_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON monthly_summaries FOR UPDATE USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- 5. Triggers and Functions

-- Function to auto-create settings on user signup
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create settings when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_settings();

-- 6. Optional: Monthly Summary Generation (Requires pg_cron)
-- Uncomment the following block if you have enabled pg_cron extension


CREATE OR REPLACE FUNCTION generate_monthly_summary()
RETURNS void AS $$
BEGIN
  -- Generate summary for the previous month
  INSERT INTO monthly_summaries (user_id, month, year, total_spent, status, category_breakdown)
  SELECT 
    e.user_id,
    e.month,
    e.year,
    SUM(e.amount) as total_spent,
    CASE 
      WHEN SUM(e.amount) >= COALESCE(b.total_budget, 0) THEN 'red'
      WHEN SUM(e.amount) >= COALESCE(b.total_budget, 0) * 0.8 THEN 'yellow'
      ELSE 'green'
    END as status,
    (
      SELECT jsonb_object_agg(category, category_total)
      FROM (
        SELECT category, SUM(amount) as category_total
        FROM expenses
        WHERE user_id = e.user_id 
          AND month = e.month 
          AND year = e.year
        GROUP BY category
      ) cat_data
    ) as category_breakdown
  FROM expenses e
  LEFT JOIN budgets b ON b.user_id = e.user_id AND b.month = e.month AND b.year = e.year
  WHERE e.month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
    AND e.year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
  GROUP BY e.user_id, e.month, e.year, b.total_budget
  ON CONFLICT (user_id, month, year) DO UPDATE
  SET 
    total_spent = EXCLUDED.total_spent,
    status = EXCLUDED.status,
    category_breakdown = EXCLUDED.category_breakdown;

  -- Auto-create budgets for new month (copy from previous month)
  INSERT INTO budgets (user_id, month, year, total_budget, category_budgets)
  SELECT 
    user_id,
    EXTRACT(MONTH FROM CURRENT_DATE) as month,
    EXTRACT(YEAR FROM CURRENT_DATE) as year,
    total_budget,
    category_budgets
  FROM budgets
  WHERE month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
    AND year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
  ON CONFLICT (user_id, month, year) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run on the 1st of every month at 00:01 AM
SELECT cron.schedule(
  'monthly-summary-generation',
  '1 0 1 * *',
  'SELECT generate_monthly_summary();'
);
