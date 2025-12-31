'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from './ui/Skeleton'
import { toast } from 'sonner'

export default function Profile() {
    const { user, setUser } = useStore()
    const [loading, setLoading] = useState(true)
    const [showEmailModal, setShowEmailModal] = useState(false)
    const [showSecurityModal, setShowSecurityModal] = useState(false)
    const [emailNotifications, setEmailNotifications] = useState({
        budgetAlerts: true,
        weeklyReports: true,
        monthlyReports: false
    })
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [stats, setStats] = useState({
        totalExpenses: 0,
        totalSpent: 0,
        memberSince: '',
        lastLogin: ''
    })

    useEffect(() => {
        loadProfileData()
    }, [user])

    const loadProfileData = async () => {
        if (!user) return

        try {
            // Get user metadata for join date
            const { data: { user: authUser } } = await supabase.auth.getUser()

            // Get total stats
            const { data: expenses, error } = await supabase
                .from('expenses')
                .select('amount')
                .eq('user_id', user.id)

            if (error) throw error

            const totalSpent = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0

            setStats({
                totalExpenses: expenses?.length || 0,
                totalSpent,
                memberSince: authUser?.created_at ? format(new Date(authUser.created_at), 'MMMM dd, yyyy') : 'N/A',
                lastLogin: authUser?.last_sign_in_at ? format(new Date(authUser.last_sign_in_at), 'MMMM dd, yyyy HH:mm') : 'N/A'
            })
        } catch (error) {
            console.error('Error loading profile:', error)
            toast.error('Failed to load profile data')
        } finally {
            setLoading(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        toast.success('Signed out successfully')
    }

    const handleEmailNotificationSave = () => {
        // In a real app, you'd save these preferences to your database
        toast.success('Email preferences updated!')
        setShowEmailModal(false)
    }

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            })

            if (error) throw error

            toast.success('Password updated successfully!')
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setShowSecurityModal(false)
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 mb-6 border border-gray-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {user?.email?.[0].toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <h2 className="text-2xl font-bold dark:text-white mb-1">My Profile</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{user?.email}</p>
                        <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                Free Plan
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                                Member since {stats.memberSince}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <span className="text-xl">💰</span>
                        </div>
                        <h3 className="font-medium text-gray-600 dark:text-gray-400">Total Spent</h3>
                    </div>
                    <p className="text-2xl font-bold dark:text-white">{formatCurrency(stats.totalSpent)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All time expenditure</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <span className="text-xl">📝</span>
                        </div>
                        <h3 className="font-medium text-gray-600 dark:text-gray-400">Total Entries</h3>
                    </div>
                    <p className="text-2xl font-bold dark:text-white">{stats.totalExpenses}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Expenses tracked</p>
                </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="font-bold dark:text-white">Account Settings</h3>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    <div 
                        onClick={() => setShowEmailModal(true)}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400">📧</span>
                            <div>
                                <p className="font-medium dark:text-gray-200">Email Notifications</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your email preferences</p>
                            </div>
                        </div>
                        <span className="text-gray-400">›</span>
                    </div>

                    <div 
                        onClick={() => setShowSecurityModal(true)}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400">🔒</span>
                            <div>
                                <p className="font-medium dark:text-gray-200">Security</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Change password & security settings</p>
                            </div>
                        </div>
                        <span className="text-gray-400">›</span>
                    </div>

                    <div className="p-4">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                    two&two v1.0.0 • Last login: {stats.lastLogin}
                </p>
            </div>

            {/* Email Notifications Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold dark:text-white">Email Notifications</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose what updates you'd like to receive</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium dark:text-white">Budget Alerts</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when you exceed budget limits</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={emailNotifications.budgetAlerts}
                                    onChange={(e) => setEmailNotifications(prev => ({ ...prev, budgetAlerts: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium dark:text-white">Weekly Reports</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Weekly spending summary</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={emailNotifications.weeklyReports}
                                    onChange={(e) => setEmailNotifications(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium dark:text-white">Monthly Reports</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Monthly spending analysis</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={emailNotifications.monthlyReports}
                                    onChange={(e) => setEmailNotifications(prev => ({ ...prev, monthlyReports: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEmailNotificationSave}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Modal */}
            {showSecurityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold dark:text-white">Security Settings</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Update your password and security preferences</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                    placeholder="Enter current password"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                    placeholder="Enter new password"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowSecurityModal(false)
                                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                                }}
                                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
