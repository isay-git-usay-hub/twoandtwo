'use client'

import { useEffect } from 'react'
import { useTheme } from '@/lib/themeStore'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isDark } = useTheme()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <html lang="en">
      <head>
        <title>two&two - Expense Tracker</title>
        <meta name="description" content="Manage your monthly budget and track expenses" />
      </head>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-center" richColors closeButton theme={isDark ? 'dark' : 'light'} />
      </body>
    </html>
  )
}
