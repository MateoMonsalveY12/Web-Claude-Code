import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AccountLoginPage() {
  const { user, loading, signInWithMagicLink, signInWithGoogle } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from ?? '/'

  const [email,     setEmail]     = useState('')
  const [sent,      setSent]      = useState(false)
  const [error,     setError]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { document.title = 'Iniciar sesión | Bialy' }, [])

  // Already logged in → redirect
  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true })
  }, [loading, user, navigate, from])

  // Persist the intended destination so AccountCallbackPage can read it after
  // the OAuth/magic-link redirect (which loses React Router location.state).
  function saveRedirect() {
    if (from && from !== '/') {
      sessionStorage.setItem('bialy-login-redirect', from)
    } else {
      sessionStorage.removeItem('bialy-login-redirect')
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim())           return setError('Ingresa tu correo electrónico')
    if (!emailRe.test(email))    return setError('Correo electrónico inválido')

    setSubmitting(true)
    try {
      saveRedirect()
      await signInWithMagicLink(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      saveRedirect()
      await signInWithGoogle()
      // Redirect happens automatically via OAuth flow
    } catch (err) {
      setError(err.message || 'Error al conectar con Google.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-border border-t-brand-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="font-display tracking-[0.22em] text-[2rem] uppercase text-brand-black"
          >
            BIALY
          </Link>
        </div>

        {/* Card */}
        <div className="border border-brand-border p-8">
          <h1 className="font-display text-[1.4rem] tracking-[0.05em] text-brand-black mb-6 text-center">
            Iniciar sesión
          </h1>

          {sent ? (
            /* ── Magic link sent state ── */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-gray flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <p className="font-sans text-sm font-semibold text-brand-black">Revisa tu correo</p>
              <p className="font-sans text-xs text-brand-black/60 leading-relaxed">
                Te enviamos un link para entrar a <strong>{email}</strong>.
                El link expira en 10 minutos.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="font-sans text-xs underline text-brand-black/50 hover:text-brand-black mt-2"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            /* ── Login form ── */
            <>
              {error && (
                <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-3" noValidate>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  className="input-brand"
                  autoComplete="email"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full text-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando…' : 'Continuar'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-brand-border" />
                <span className="font-sans text-[0.7rem] text-brand-black/40 whitespace-nowrap">
                  o continúa con
                </span>
                <div className="flex-1 h-px bg-brand-border" />
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 border border-brand-border py-3 font-sans text-sm text-brand-black hover:bg-brand-gray transition-colors duration-150"
              >
                {/* Official Google "G" icon */}
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continuar con Google
              </button>
            </>
          )}
        </div>

        {/* Footer legal */}
        <p className="font-sans text-[0.7rem] text-brand-black/35 text-center mt-5 leading-relaxed px-2">
          Si continúas, aceptas nuestros{' '}
          <a href="#" className="underline hover:text-brand-black/60">Términos de servicio</a>
          {' '}y{' '}
          <a href="#" className="underline hover:text-brand-black/60">Política de privacidad</a>.
        </p>
      </div>
    </div>
  )
}
