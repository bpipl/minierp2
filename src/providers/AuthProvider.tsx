import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User, Permissions } from '@/types'

interface AuthContextType {
  user: User | null
  permissions: Permissions | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  hasPermission: (permission: keyof Permissions) => boolean
  hasAnyPermission: (permissions: (keyof Permissions)[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const fetchUserProfile = async (supabaseUser: SupabaseUser, retryCount = 0) => {
    const maxRetries = 3
    const retryDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff
    
    try {
      console.log('🔍 Fetching user profile for:', supabaseUser.email, retryCount > 0 ? `(retry ${retryCount})` : '')
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('id', supabaseUser.id)
        .single()

      clearTimeout(timeoutId)

      if (error) {
        console.error('❌ Error fetching user profile:', error)
        
        // Retry on network errors
        if (retryCount < maxRetries && (error.message?.includes('Load failed') || error.message?.includes('network'))) {
          console.log(`🔄 Retrying profile fetch in ${retryDelay}ms...`)
          setTimeout(() => fetchUserProfile(supabaseUser, retryCount + 1), retryDelay)
          return
        }
        return
      }

      if (userData) {
        console.log('✅ User profile loaded:', userData.email)
        setUser(userData as User)
        setPermissions(userData.role?.permissions as Permissions || null)
      }
    } catch (error: any) {
      console.error('💥 Profile fetch error:', error)
      
      // Retry on network errors
      if (retryCount < maxRetries && (error.name === 'AbortError' || error.message?.includes('Load failed') || error.message?.includes('network'))) {
        console.log(`🔄 Retrying profile fetch in ${retryDelay}ms...`)
        setTimeout(() => fetchUserProfile(supabaseUser, retryCount + 1), retryDelay)
        return
      }
    }
  }

  useEffect(() => {
    // Get initial session with retry logic
    const getInitialSession = async (retryCount = 0) => {
      const maxRetries = 2
      const retryDelay = Math.pow(2, retryCount) * 1000
      
      try {
        console.log('🔄 Getting initial session...', retryCount > 0 ? `(retry ${retryCount})` : '')
        
        // Add timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        clearTimeout(timeoutId)
        
        if (error) {
          console.error('❌ Error getting initial session:', error)
          
          // Retry on network errors
          if (retryCount < maxRetries && (error.message?.includes('Load failed') || error.message?.includes('network'))) {
            console.log(`🔄 Retrying initial session in ${retryDelay}ms...`)
            setTimeout(() => getInitialSession(retryCount + 1), retryDelay)
            return
          }
        }
        
        if (session?.user) {
          await fetchUserProfile(session.user)
        }
      } catch (error: any) {
        console.error('💥 Initial session error:', error)
        
        // Retry on network errors
        if (retryCount < maxRetries && (error.name === 'AbortError' || error.message?.includes('Load failed') || error.message?.includes('network'))) {
          console.log(`🔄 Retrying initial session in ${retryDelay}ms...`)
          setTimeout(() => getInitialSession(retryCount + 1), retryDelay)
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setPermissions(null)
        }
        
        setIsLoading(false)
      }
    )

    getInitialSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string, retryCount = 0) => {
    const maxRetries = 2
    const retryDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff
    
    try {
      setIsLoading(true)
      console.log('🔑 Signing in:', email, retryCount > 0 ? `(retry ${retryCount})` : '')
      
      // Add timeout for sign-in
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      clearTimeout(timeoutId)
      
      if (error) {
        console.error('❌ Sign in error:', error)
        
        // Retry on network errors
        if (retryCount < maxRetries && (
          error.message?.includes('Load failed') || 
          error.message?.includes('network') ||
          error.message?.includes('fetch')
        )) {
          console.log(`🔄 Retrying sign in in ${retryDelay}ms...`)
          setIsLoading(false)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return signIn(email, password, retryCount + 1)
        }
        
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('💥 Sign in failed:', error)
      
      // Retry on network errors
      if (retryCount < maxRetries && (
        error.name === 'AbortError' || 
        error.message?.includes('Load failed') || 
        error.message?.includes('network') ||
        error.message?.includes('connection')
      )) {
        console.log(`🔄 Retrying sign in in ${retryDelay}ms...`)
        setIsLoading(false)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return signIn(email, password, retryCount + 1)
      }
      
      return { success: false, error: error.message || 'Login failed due to network issues. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setPermissions(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const hasPermission = (permission: keyof Permissions): boolean => {
    return permissions?.[permission] || false
  }

  const hasAnyPermission = (permissionList: (keyof Permissions)[]): boolean => {
    return permissionList.some(permission => hasPermission(permission))
  }

  const value: AuthContextType = {
    user,
    permissions,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    hasPermission,
    hasAnyPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}