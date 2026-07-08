import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      theme: 'dark',
      _hydrated: false,

      setHydrated: () => set({ _hydrated: true }),
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      toggleTheme: () =>
        set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      isAdmin: () => get().user?.role === 'admin',
      isLoggedIn: () => !!get().token,
    }),
    {
      name: 'ielts-auth',
      partialize: s => ({ user: s.user, token: s.token, theme: s.theme }),
      // state here is the fully-rehydrated state object (with all actions),
      // called synchronously after localStorage is read.
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
