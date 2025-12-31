'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Refresh Page
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-6 text-left p-4 bg-gray-100 dark:bg-slate-900 rounded-lg overflow-auto max-h-48">
                                <p className="text-xs font-mono text-red-600 dark:text-red-400">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
