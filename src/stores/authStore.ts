import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Permissions } from '@/types'

interface AuthState {
  user: User | null
  permissions: Permissions | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setPermissions: (permissions: Permissions | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      permissions: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setPermissions: (permissions) => set({ permissions }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ 
        user: null, 
        permissions: null, 
        isAuthenticated: false, 
        isLoading: false 
      }),
    }),
    {
      name: 'mini-erp-auth',
      partialize: (state) => ({ 
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)