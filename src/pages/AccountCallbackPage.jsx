/**
 * /cuenta/callback
 *
 * Supabase redirects here after:
 *   - Magic Link click (URL contains #access_token=...)
 *   - Google OAuth callback (URL contains code= or access_token=)
 *
 * Supabase-js v2 auto-detects the hash/search params and fires
 * onAuthStateChange(SIGNED_IN) — we just wait for it and redirect.
 *
 * Redirect priority:
 *   1. sessionStorage 'bialy-login-redirect' (set by AccountLoginPage before
 *      the browser navigates away for OAuth / magic link)
 *   2. Fall back to '/' (home)
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const REDIRECT_KEY      = 'bialy-login-redirect'
const AFTER_PROFILE_KEY = 'bialy-after-profile'

export default function AccountCallbackPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Verificando…')

  useEffect(() => { document.title = 'Verificando… | Bialy' }, [])

  useEffect(() => {
    if (loading) return
    if (!user) return // Still waiting for Supabase to resolve the token

    setMessage('Bienvenido/a…')

    // Read (and immediately clear) the intended destination
    const redirect = sessionStorage.getItem(REDIRECT_KEY) || '/'
    sessionStorage.removeItem(REDIRECT_KEY)

    if (!supabase) {
      navigate(redirect, { replace: true })
      return
    }

    supabase
      .from('customers')
      .select('full_name, phone')
      .eq('email', user.email)
      .single()
      .then(({ data }) => {
        if (!data || !data.full_name) {
          // New user — needs to complete profile.
          // Save destination so CompleteProfilePage can forward them afterward.
          sessionStorage.setItem(AFTER_PROFILE_KEY, redirect)
          navigate('/cuenta/completar-perfil', { replace: true })
        } else {
          // Existing user with profile — go to intended destination
          navigate(redirect, { replace: true })
        }
      })
      .catch(() => {
        // Fallback: go to intended destination even if profile check fails
        navigate(redirect, { replace: true })
      })
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-9 h-9 border-2 border-brand-border border-t-brand-black rounded-full animate-spin" />
      <p className="font-sans text-sm text-brand-black/50">{message}</p>
    </div>
  )
}
