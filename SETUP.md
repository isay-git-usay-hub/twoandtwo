# Quick Setup Guide for two&two

## Current Status
✅ Dependencies installed
✅ Dev server running at http://localhost:3000

## Next Steps

### 1. Create Supabase Account & Project

1. Go to https://supabase.com
2. Sign up / Sign in
3. Click "New Project"
4. Choose a name (e.g., "two-and-two")
5. Set a database password (save it!)
6. Choose a region close to you
7. Wait for project to be created (~2 minutes)

### 2. Set Up Database

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `database.sql` from this project
4. Paste it into the SQL Editor
5. Click "Run" or press Ctrl+Enter
6. You should see "Success. No rows returned"

### 3. Get API Keys

1. In Supabase dashboard, go to **Settings** (gear icon) > **API**
2. Find these two values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (under "Project API keys")

### 4. Configure Environment Variables

1. In VS Code, create a new file called `.env.local` in the project root
2. Add these lines (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

### 5. Restart Dev Server

1. Stop the current dev server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Open http://localhost:3000

### 6. Test the App

1. Click "Sign Up"
2. Enter email and password
3. Check your email for confirmation link
4. Click the link to verify
5. Sign in with your credentials
6. Set up your monthly budget
7. Start adding expenses!

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file
- Make sure there are no extra spaces
- Restart the dev server after changing `.env.local`

### "Row Level Security" error
- Make sure you ran the entire `database.sql` script
- Check that all policies were created in Supabase

### Email confirmation not arriving
- Check spam folder
- In Supabase dashboard, go to Authentication > Settings
- You can disable email confirmation for testing (not recommended for production)

## Security Note

⚠️ Never commit `.env.local` to git - it's already in `.gitignore`
