'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

// Function to get a random Pokémon avatar URL
function getRandomPokemonAvatar(): string {
  // List of popular and cool-looking Pokémon IDs
  const coolPokemonIds = [
    6,  // Charizard
    9,  // Blastoise
    25, // Pikachu
    38, // Ninetales
    59, // Arcanine
    65, // Alakazam
    94, // Gengar
    130, // Gyarados
    131, // Lapras
    143, // Snorlax
    149, // Dragonite
    150, // Mewtwo
    151, // Mew
    196, // Espeon
    197, // Umbreon
    248, // Tyranitar
    249, // Lugia
    250, // Ho-Oh
    251, // Celebi
    384, // Rayquaza
    445, // Garchomp
    448, // Lucario
    483, // Dialga
    484, // Palkia
    487, // Giratina
    493, // Arceus
    643, // Reshiram
    644, // Zekrom
    646, // Kyurem
    716, // Xerneas
    717, // Yveltal
    718, // Zygarde
    800, // Necrozma
    888, // Zacian
    889, // Zamazenta
    890, // Eternatus
    891, // Kubfu
    892, // Urshifu
    893, // Zarude
    894, // Regieleki
    895, // Regidrago
    896, // Glastrier
    897, // Spectrier
    898, // Calyrex
  ]

  const randomId = coolPokemonIds[Math.floor(Math.random() * coolPokemonIds.length)]
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randomId}.png`
}

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
      // Add navigation to dashboard/jobs after successful login
      window.location.href = '/dashboard/jobs'
    } catch (error) {
      console.error('Error logging in:', error)
      toast.error('Failed to log in. Please check your credentials.')
      throw error
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    try {
      // Generate a random Pokémon avatar URL
      const pokemonAvatarUrl = getRandomPokemonAvatar()

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            avatar_url: pokemonAvatarUrl,
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