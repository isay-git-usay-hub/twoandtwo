'use client'

import { Home, BarChart2, PlusCircle, User } from 'lucide-react'

interface MobileNavProps {
    activeTab: 'dashboard' | 'reports' | 'profile'
    onTabChange: (tab: 'dashboard' | 'reports' | 'profile') => void
    onAddClick: () => void
    onSettingsClick: () => void
}

export default function MobileNav({
    activeTab,
    onTabChange,
    onAddClick,
    onSettingsClick
}: MobileNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-6 py-3 md:hidden z-40 pb-safe">
            <div className="flex justify-between items-center">
                <button
                    onClick={() => onTabChange('dashboard')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <Home size={24} />
                    <span className="text-[10px] font-medium">Home</span>
                </button>

                <button
                    onClick={onAddClick}
                    className="flex flex-col items-center gap-1 -mt-8"
                >
                    <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        <PlusCircle size={28} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Add</span>
                </button>

                <button
                    onClick={() => onTabChange('reports')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <BarChart2 size={24} />
                    <span className="text-[10px] font-medium">Reports</span>
                </button>

                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <User size={24} />
                    <span className="text-[10px] font-medium">Profile</span>
                </button>
            </div>
        </div>
    )
}
