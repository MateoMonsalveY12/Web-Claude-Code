import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Sign In ──────────────────────────────────────────────────────────────
  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase no está configurado')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // ── Sign Up ──────────────────────────────────────────────────────────────
  async function signUp(email, password, profile) {
    if (!supabase) throw new Error('Supabase no está configurado')

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Create customer record immediately
    if (data.user) {
      await supabase.from('customers').upsert({
        email,
        full_name:       profile?.full_name       ?? '',
        phone:           profile?.phone           ?? '',
        document_type:   profile?.document_type   ?? '',
        document_number: profile?.document_number ?? '',
      }, { onConflict: 'email', ignoreDuplicates: false })
    }

    return data
  }

  // ── Sign Out ─────────────────────────────────────────────────────────────
  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  // ── Get customer profile ─────────────────────────────────────────────────
  async function getCustomer() {
    if (!supabase || !user) return null
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('email', user.email)
      .single()
    return data
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, getCustomer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
