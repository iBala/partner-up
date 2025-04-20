'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  showAuthModal: boolean
  authMode: 'login' | 'signup'
  showConnectModal: boolean
  selectedJobId: string | null
  // Methods
  openAuthModal: (mode: 'login' | 'signup') => void
  closeAuthModal: () => void
  openConnectModal: (jobId: string) => void
  closeConnectModal: () => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const closeAuthModal = () => {
    setShowAuthModal(false)
  }

  const openConnectModal = (jobId: string) => {
    setSelectedJobId(jobId)
    setShowConnectModal(true)
  }

  const closeConnectModal = () => {
    setShowConnectModal(false)
    setSelectedJobId(null)
  }

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      closeAuthModal()
      toast.success('Successfully logged in')
    } catch (error) {
      console.error('Error logging in:', error)
      toast.error('Failed to log in. Please check your credentials.')
      throw error
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })
      if (error) throw error
      closeAuthModal()
      toast.success('Account created successfully! Please check your email to verify your account.')
    } catch (error) {
      console.error('Error signing up:', error)
      toast.error('Failed to create account. Please try again.')
      throw error
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Successfully logged out')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to log out. Please try again.')
      throw error
    }
  }

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error logging in with Google:', error)
      toast.error('Failed to log in with Google. Please try again.')
      throw error
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    showAuthModal,
    authMode,
    showConnectModal,
    selectedJobId,
    openAuthModal,
    closeAuthModal,
    openConnectModal,
    closeConnectModal,
    login,
    signup,
    logout,
    loginWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 