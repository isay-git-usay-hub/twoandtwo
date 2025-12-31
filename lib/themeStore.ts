import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
  initTheme: () => void
}

export const useTheme = create<ThemeState>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => {
    const newIsDark = !state.isDark
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    }
    return { isDark: newIsDark }
  }),
  initTheme: () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      set({ isDark: savedTheme === 'dark' })
    }
  }
}))
