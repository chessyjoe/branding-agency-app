"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isConfigured: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        setIsConfigured(true)
      } catch (error) {
        console.warn("Supabase not configured or failed to get session:", error)
        setUser(null)
        setIsConfigured(false)
      }
      setLoading(false)
    }

    getInitialSession()

    let subscription: any = null

    const setupAuthListener = async () => {
      try {
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        })
        subscription = authSubscription
      } catch (error) {
        console.warn("Failed to set up auth listener:", error)
      }
    }

    setupAuthListener()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, []) // Removed isConfigured from dependency array to prevent infinite loop

  const signOut = async () => {
    if (isConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.warn("Failed to sign out:", error)
      }
    }
  }

  return <AuthContext.Provider value={{ user, loading, signOut, isConfigured }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
