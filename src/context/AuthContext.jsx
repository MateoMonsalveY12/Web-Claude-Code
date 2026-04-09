import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Remove all Supabase auth entries from localStorage.
// Called on initialization timeout to break any stale refresh lock left by a crashed tab.
function clearSupabaseStorage() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
    keys.forEach(k => localStorage.removeItem(k))
    if (keys.length) console.log(`[auth] Eliminadas ${keys.length} key(s) de Supabase del localStorage`)
  } catch (e) {
    console.warn('[auth] Error limpiando storage:', e)
  }
}

// Before the Supabase client reads its stored token, discard any entry whose JSON is
// unparseable (caused by an interrupted write during a rapid reload).
function pruneCorruptedTokens() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach(key => {
        const raw = localStorage.getItem(key)
        if (!raw) return
        try { JSON.parse(raw) } catch {
          console.warn(`[auth] Token corrupto eliminado: ${key}`)
          localStorage.removeItem(key)
        }
      })
  } catch (e) {
    console.warn('[auth] Error validando tokens:', e)
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Discard corrupted tokens before Supabase tries to parse them.
    pruneCorruptedTokens()

    // Safety net: if Supabase hangs (stale refresh lock, expired token, network issue),
    // clear ALL Supabase auth storage and reset every state variable so the app stays
    // fully usable. The next page load will find an empty token slot and init cleanly.
    const loadingTimer = setTimeout(() => {
      console.warn('[auth] Timeout de inicialización — estado reseteado')
      clearSupabaseStorage()
      setUser(null)
      setSession(null)
      setLoading(false)
    }, 5000)

    // Get current session on mount (may be slow if token needs refreshing)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        clearTimeout(loadingTimer)
      })
      .catch((err) => {
        console.warn('[auth] getSession error:', err?.message)
        setLoading(false)
        clearTimeout(loadingTimer)
      })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      // Resolve loading on any definitive auth event:
      // - INITIAL_SESSION: normal fast path (no expired token)
      // - SIGNED_IN: fallback when an expired token triggers a refresh first;
      //   Supabase emits SIGNED_IN (not INITIAL_SESSION) after the refresh completes
      // - SIGNED_OUT: also a definitive resolved state
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(false)
        clearTimeout(loadingTimer)
      }

      // On first sign-in (Magic Link or OAuth), ensure customer record exists
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const u = session.user
        supabase.from('customers').upsert({
          email:     u.email,
          full_name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? '',
        }, { onConflict: 'email', ignoreDuplicates: true })
          .then(({ error }) => {
            if (error) console.warn('[AuthContext] customers upsert:', error.message)
          })
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimer)
    }
  }, [])

  // ── Magic Link (passwordless) ────────────────────────────────────────────
  async function signInWithMagicLink(email) {
    if (!supabase) throw new Error('Supabase no está configurado')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/cuenta/callback` },
    })
    if (error) throw error
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────
  async function signInWithGoogle() {
    if (!supabase) throw new Error('Supabase no está configurado')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:  `${window.location.origin}/cuenta/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }

  // ── Sign Up (kept for compatibility — primary flow is Magic Link) ────────
  async function signUp(email, password, profile) {
    if (!supabase) throw new Error('Supabase no está configurado')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: profile?.full_name ?? '' } },
    })
    if (error) throw error

    if (data.user) {
      const { error: upsertErr } = await supabase.from('customers').upsert({
        email,
        full_name:       profile?.full_name       ?? '',
        phone:           profile?.phone           ?? '',
        document_type:   profile?.document_type   ?? '',
        document_number: profile?.document_number ?? '',
      }, { onConflict: 'email', ignoreDuplicates: false })
      if (upsertErr) console.warn('[AuthContext] customers upsert:', upsertErr.message)
    }
    return data
  }

  // ── Sign Out ─────────────────────────────────────────────────────────────
  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  // ── Get customer profile (legacy — customers table) ─────────────────────
  async function getCustomer() {
    if (!supabase || !user) return null
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('email', user.email)
      .single()
    return data
  }

  // ── Shipping profile (customer_profiles table — address + doc data) ───────
  async function getShippingProfile() {
    if (!supabase || !user) return null
    console.log('[checkout:profile] Cargando perfil del usuario...')
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error?.code === 'PGRST116') {
        // No row found — this is normal for new users
        console.log('[checkout:profile] No hay perfil guardado')
        return null
      }
      if (error) { console.warn('[checkout:profile] Error:', error.message); return null }
      console.log('[checkout:profile] Perfil encontrado, prellenando formulario...')
      return data
    } catch (err) {
      console.warn('[checkout:profile] getShippingProfile error:', err.message)
      return null
    }
  }

  async function saveShippingProfile(profileData) {
    if (!supabase || !user) return
    console.log('[checkout:profile] Guardando perfil actualizado...')
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .upsert({ id: user.id, ...profileData, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) throw error
      console.log('[checkout:profile] Perfil guardado exitosamente')
    } catch (err) {
      console.warn('[checkout:profile] saveShippingProfile error:', err.message)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signInWithMagicLink, signInWithGoogle, signUp, signOut,
      getCustomer, getShippingProfile, saveShippingProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
