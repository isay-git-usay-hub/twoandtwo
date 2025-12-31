import { create } from 'zustand'

interface User {
  id: string
  email: string
}

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
