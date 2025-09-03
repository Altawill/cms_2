import { create } from 'zustand'
import authService from '../services/authService'

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  orgUnitId: string;
  position?: string;
  department?: string;
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  
  // Actions
  login: (usernameOrEmail: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => void
  clearError: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  getAccessibleFeatures: () => string[]
  canApprove: (amount?: number) => boolean
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  login: async (usernameOrEmail: string, password: string) => {
    try {
      set({ loading: true, error: null })
      
      const response = await authService.login(usernameOrEmail, password)
      
      set({ 
        user: response.user, 
        loading: false, 
        error: null 
      })
      
    } catch (error: any) {
      console.error('Login error:', error)
      set({ 
        error: error.message || 'Login failed', 
        loading: false,
        user: null
      })
    }
  },

  logout: async () => {
    try {
      set({ loading: true })
      
      authService.logout()
      
      set({ 
        user: null, 
        loading: false, 
        error: null 
      })
    } catch (error: any) {
      console.error('Logout error:', error)
      set({ error: error.message || 'Logout failed', loading: false })
    }
  },

  initialize: () => {
    set({ loading: true })
    
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser()
    
    set({ 
      user: currentUser, 
      loading: false, 
      error: null 
    })
  },

  hasRole: (role: string) => {
    const { user } = get()
    return user?.role === role
  },

  hasAnyRole: (roles: string[]) => {
    const { user } = get()
    return user ? roles.includes(user.role) : false
  },

  getAccessibleFeatures: () => {
    return authService.getAccessibleFeatures()
  },

  canApprove: (amount?: number) => {
    return authService.canApprove(amount)
  },

  clearError: () => set({ error: null })
}))

// Initialize auth state on module load
useAuth.getState().initialize()
