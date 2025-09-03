import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types/user'
import { apiService } from '../services/apiService'
import { fallbackAuthService } from '../services/fallbackAuth'

// Legacy interface for backward compatibility
interface LegacyUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
}

interface AuthContextType {
  user: User | null // Now uses the RBAC User type
  legacyUser: LegacyUser | null // For backward compatibility
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for stored session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (apiService.isAuthenticated()) {
        const currentUser = apiService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      }
      setLoading(false)
    }
    
    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      // Try API first
      const result = await apiService.login(email, password)
      
      if (result.success) {
        setUser(result.user)
        setLoading(false)
        return true
      } else {
        setError('Login failed')
        setLoading(false)
        return false
      }
    } catch (apiError) {
      console.warn('API login failed, trying fallback authentication:', apiError)
      
      try {
        // Fallback to demo authentication
        const result = await fallbackAuthService.login(email, password)
        
        if (result.success) {
          setUser(result.user)
          setLoading(false)
          return true
        }
      } catch (fallbackError) {
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Login failed'
        setError(errorMessage)
      }
      
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    // Immediately clear local state for fast UI response
    setUser(null)
    setError(null)
    
    // Clear authentication in background (non-blocking)
    apiService.logout().catch(err => {
      console.warn('Server logout failed (local logout successful):', err)
    })
  }

  const clearError = () => {
    setError(null)
  }

  // Create legacy user format for backward compatibility
  const legacyUser: LegacyUser | null = user ? {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.roles.includes('super_admin') ? 'ADMIN' : 
          user.roles.includes('admin') ? 'ADMIN' :
          user.roles.includes('manager') ? 'MANAGER' : 'USER'
  } : null

  return (
    <AuthContext.Provider value={{ user, legacyUser, loading, login, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
