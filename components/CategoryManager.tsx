'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_CATEGORIES } from '@/lib/types'
import { useUserCategories } from '@/lib/useUserCategories'
import { toast } from 'sonner'
import Input from './ui/Input'
import ConfirmModal from './ui/ConfirmModal'

export default function CategoryManager({ onClose }: { onClose: () => void }) {
  const { categories: userCategories, updateCategories } = useUserCategories()
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    setCategories([...userCategories])
  }, [userCategories])

  const addCategory = () => {
    const trimmed = newCategory.trim()
    if (!trimmed) {
      toast.error('Please enter a category name')
      return
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('This category already exists')
      return
    }
    if (categories.length >= 20) {
      toast.error('Maximum 20 categories allowed')
      return
    }
    setCategories([...categories, trimmed])
    setNewCategory('')
  }

  const removeCategory = (cat: string) => {
    if (categories.length === 1) {
      toast.error('You must have at least one category')
      return
    }
    setCategories(categories.filter(c => c !== cat))
  }

  const resetToDefaults = () => {
    setCategories([...DEFAULT_CATEGORIES])
    setShowResetConfirm(false)
    toast.success('Categories reset to defaults')
  }

  const handleSave = async () => {
    if (categories.length === 0) {
      toast.error('You must have at least one category')
      return
    }

    setLoading(true)
    const success = await updateCategories(categories)
    setLoading(false)

    if (success) {
      toast.success('Categories saved successfully')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white dark:bg-slate-900 w-full md:w-auto md:max-w-2xl h-[90dvh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 md:fade-in md:zoom-in-95 duration-200">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl md:text-2xl font-bold dark:text-white">Manage Categories</h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Customize expense categories to match your needs</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none p-2"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {/* Add New Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Add New Category</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                placeholder="e.g., Entertainment"
                maxLength={30}
                className="flex-1"
              />
              <button
                onClick={addCategory}
                className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {categories.length}/20 categories • Press Enter to add
            </p>
          </div>

          {/* Current Categories */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium dark:text-gray-300">Your Categories ({categories.length})</label>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:max-h-96 md:overflow-y-auto">
              {categories.map((cat, index) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-gray-400 text-sm font-mono shrink-0">{index + 1}.</span>
                    <span className="font-medium dark:text-gray-200 truncate">{cat}</span>
                    {DEFAULT_CATEGORIES.includes(cat) && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeCategory(cat)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors shrink-0"
                    title="Remove category"
                    disabled={categories.length === 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4 mt-4">
            <div className="flex gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Categories will appear in all dropdowns</li>
                  <li>Existing expenses keep their categories</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 md:py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 font-medium transition-colors dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || categories.length === 0}
              className="flex-1 px-4 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetToDefaults}
        title="Reset Categories?"
        message="This will remove all custom categories and restore the default ones. This action cannot be undone."
        confirmText="Reset"
        isDangerous
      />
    </div>
  )
}
