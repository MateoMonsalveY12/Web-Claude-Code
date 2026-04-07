/**
 * /cuenta/callback
 *
 * Supabase redirects here after:
 *   - Magic Link click (URL contains #access_token=...)
 *   - Google OAuth callback (URL contains code= or access_token=)
 *
 * Supabase-js v2 auto-detects the hash/search params and fires
 * onAuthStateChange(SIGNED_IN) — we just wait for it and redirect.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AccountCallbackPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Verificando…')

  useEffect(() => { document.title = 'Verificando… | Bialy' }, [])

  useEffect(() => {
    if (loading) return
    if (!user) return // Still waiting for supabase to resolve the token

    // User is authenticated — check if they need to complete their profile
    if (!supabase) { navigate('/mi-cuenta/pedidos', { replace: true }); return }

    setMessage('Bienvenido/a…')

    supabase
      .from('customers')
      .select('full_name, phone')
      .eq('email', user.email)
      .single()
      .then(({ data }) => {
        if (!data || !data.full_name) {
          // New user or no profile → complete profile first
          navigate('/cuenta/completar-perfil', { replace: true })
        } else {
          // Existing user with profile → go to orders
          navigate('/mi-cuenta/pedidos', { replace: true })
        }
      })
      .catch(() => {
        // Fallback: go to orders even if profile check fails
        navigate('/mi-cuenta/pedidos', { replace: true })
      })
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-9 h-9 border-2 border-brand-border border-t-brand-black rounded-full animate-spin" />
      <p className="font-sans text-sm text-brand-black/50">{message}</p>
    </div>
  )
}
