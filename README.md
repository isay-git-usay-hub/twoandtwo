# two&two - Personal Expense Tracker

A full-stack web application to manage monthly budgets, track daily expenses, and generate weekly, monthly, and yearly reports.

## Features

- ✅ User Authentication (Email + Password)
- ✅ Monthly Budget Setup with Category Budgets
- ✅ Expense Tracking with Categories
- ✅ Real-time Dashboard with Progress Bars
- ✅ Weekly Reports
- ✅ Monthly Reports with Status Indicators
- ✅ Yearly Reports with Trends
- ✅ Clean, Modern UI
- ✅ Mobile Responsive

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL from `database.sql`
3. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### First Time Setup

1. Sign up with email and password
2. Set your monthly budget (total + optional category budgets)
3. Start adding expenses

### Adding Expenses

- Click "Add Expense" on the dashboard
- Enter amount, category, description, and payment method
- Expense is automatically tracked for the current month

### Viewing Reports

- **Dashboard**: Real-time budget overview and recent expenses
- **Reports Tab**: 
  - Weekly summary with top category
  - Monthly breakdown with status
  - Yearly trends (after completing months)

## Monthly Reset Logic

The app handles month transitions automatically in two ways:

### Automatic (Recommended)

**Client-Side Auto-Reset:**
- When you open the app at the start of a new month, it automatically:
  - Copies your previous month's budget to the new month
  - Generates a summary for the completed month
  - No manual action needed!

**Server-Side Cron Job (Optional):**
- For production, set up a Supabase cron job
- Run the SQL in `supabase-cron-setup.sql` in your Supabase SQL Editor
- This will automatically process month-end at midnight on the 1st of each month
- Requires enabling the `pg_cron` extension in Supabase

### Manual Monthly Reset (Fallback)

If needed, run this SQL in Supabase at month end:

```sql
-- Generate monthly summary for completed month
INSERT INTO monthly_summaries (user_id, month, year, total_spent, status, category_breakdown)
SELECT 
  user_id,
  month,
  year,
  SUM(amount) as total_spent,
  CASE 
    WHEN SUM(amount) >= (SELECT total_budget FROM budgets WHERE budgets.user_id = expenses.user_id AND budgets.month = expenses.month AND budgets.year = expenses.year) THEN 'red'
    WHEN SUM(amount) >= (SELECT total_budget FROM budgets WHERE budgets.user_id = expenses.user_id AND budgets.month = expenses.month AND budgets.year = expenses.year) * 0.8 THEN 'yellow'
    ELSE 'green'
  END as status,
  jsonb_object_agg(category, category_total) as category_breakdown
FROM (
  SELECT user_id, month, year, category, SUM(amount) as category_total
  FROM expenses
  WHERE month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
    AND year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
  GROUP BY user_id, month, year, category
) grouped
GROUP BY user_id, month, year
ON CONFLICT (user_id, month, year) DO UPDATE
SET total_spent = EXCLUDED.total_spent,
    status = EXCLUDED.status,
    category_breakdown = EXCLUDED.category_breakdown;
```

## Database Schema

### Tables

- **budgets**: Monthly budget configurations
- **expenses**: All expense transactions
- **monthly_summaries**: Historical monthly reports

### Key Features

- Row Level Security (RLS) enabled
- User data isolation
- Automatic timestamps
- JSON support for flexible category data

## Deployment

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

Add environment variables in Vercel dashboard.

## Future Enhancements

- PDF export for reports
- Recurring expenses
- Budget templates
- Expense categories customization
- Multi-currency support
- Expense attachments (receipts)

## License

MIT
