import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useStore } from './store'
import { DEFAULT_CATEGORIES } from './types'

export function useUserCategories() {
  const { user } = useStore()
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [user])

  const loadCategories = async () => {
    if (!user) {
      setCategories(DEFAULT_CATEGORIES)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('categories')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading categories:', error)
      }

      if (data?.categories && data.categories.length > 0) {
        setCategories(data.categories)
      } else {
        setCategories(DEFAULT_CATEGORIES)
      }
    } catch (error) {
      console.error('Unexpected error loading categories:', error)
      setCategories(DEFAULT_CATEGORIES)
    } finally {
      setLoading(false)
    }
  }

  const updateCategories = async (newCategories: string[]) => {
    if (!user) return false

    try {
      // First try to update
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          categories: newCategories,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        // If update fails (likely no row), try insert
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            categories: newCategories,
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error updating categories:', insertError)
          return false
        }
      }

      setCategories(newCategories)
      return true
    } catch (error) {
      console.error('Unexpected error updating categories:', error)
      return false
    }
  }

  return { categories, loading, updateCategories, refreshCategories: loadCategories }
}
