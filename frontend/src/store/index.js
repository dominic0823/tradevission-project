import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'tradevission-auth' }
  )
)

export const usePriceStore = create((set) => ({
  prices: {},
  updatePrices: (updates) => set((state) => ({
    prices: { ...state.prices, ...updates },
  })),
}))

export const useUIStore = create((set) => ({
  activeSymbol: 'AAPL',
  setActiveSymbol: (sym) => set({ activeSymbol: sym }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))