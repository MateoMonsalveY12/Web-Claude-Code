import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

// Maps common Supabase auth error messages to Spanish
function translateError(message) {
  if (!message) return 'Ocurrió un error. Inténtalo de nuevo.'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Correo o contraseña incorrectos.'
  if (m.includes('email already registered') || m.includes('user already registered'))
    return 'Este correo ya tiene una cuenta. Inicia sesión.'
  if (m.includes('email not confirmed'))
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.'
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Error de conexión. Verifica tu internet e intenta de nuevo.'
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
  return message
}

export default function AuthModal({ open, onClose, defaultTab = 'login' }) {
  const [tab,       setTab]       = useState(defaultTab)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  // Login fields
  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginErrors,   setLoginErrors]   = useState({})

  // Register fields
  const [regName,     setRegName]     = useState('')
  const [regEmail,    setRegEmail]    = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm,  setRegConfirm]  = useState('')
  const [regErrors,   setRegErrors]   = useState({})

  const backdropRef = useRef(null)
  const { signIn, signUp } = useAuth()

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTab(defaultTab)
      setError('')
      setSuccess('')
      setLoginErrors({})
      setRegErrors({})
    }
  }, [open, defaultTab])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  // ── Login submit ─────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    const errs = {}
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!loginEmail.trim())            errs.email    = 'Ingresa tu correo'
    else if (!emailRe.test(loginEmail)) errs.email   = 'Correo inválido'
    if (!loginPassword)                errs.password = 'Ingresa tu contraseña'
    if (Object.keys(errs).length) { setLoginErrors(errs); return }

    setLoading(true); setError('')
    try {
      await signIn(loginEmail.trim(), loginPassword)
      onClose()
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Register submit ──────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault()
    const errs = {}
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regName.trim())               errs.name     = 'Ingresa tu nombre completo'
    if (!regEmail.trim())              errs.email    = 'Ingresa tu correo'
    else if (!emailRe.test(regEmail))  errs.email    = 'Correo inválido'
    if (!regPassword)                  errs.password = 'Ingresa una contraseña'
    else if (regPassword.length < 6)   errs.password = 'Mínimo 6 caracteres'
    if (regPassword !== regConfirm)    errs.confirm  = 'Las contraseñas no coinciden'
    if (Object.keys(errs).length) { setRegErrors(errs); return }

    setLoading(true); setError(''); setSuccess('')
    try {
      const data = await signUp(regEmail.trim(), regPassword, { full_name: regName.trim() })
      // If email confirmation required, show message; else close
      if (data?.user && !data?.session) {
        setSuccess('Revisa tu correo para confirmar tu cuenta.')
      } else {
        onClose()
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4"
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="bg-white w-full max-w-md shadow-xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-black/40 hover:text-brand-black transition-colors"
          aria-label="Cerrar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Tabs */}
        <div className="flex border-b border-brand-border">
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess('') }}
              className={`flex-1 py-4 font-sans text-sm font-semibold transition-colors ${
                tab === t
                  ? 'border-b-2 border-brand-black text-brand-black'
                  : 'text-brand-black/40 hover:text-brand-black/70'
              }`}
            >
              {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <div className="p-6 pt-5">
          {/* Global error / success */}
          {error   && <p className="font-sans text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>}
          {success && <p className="font-sans text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 mb-4">{success}</p>}

          {/* ── Login form ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3" noValidate>
              <div>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={loginEmail}
                  onChange={e => { setLoginEmail(e.target.value); setLoginErrors(p => ({...p, email:''})) }}
                  className={`input-brand ${loginErrors.email ? 'border-red-500' : ''}`}
                  autoComplete="email"
                />
                {loginErrors.email && <p className="font-sans text-xs text-red-500 mt-1">{loginErrors.email}</p>}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={loginPassword}
                  onChange={e => { setLoginPassword(e.target.value); setLoginErrors(p => ({...p, password:''})) }}
                  className={`input-brand ${loginErrors.password ? 'border-red-500' : ''}`}
                  autoComplete="current-password"
                />
                {loginErrors.password && <p className="font-sans text-xs text-red-500 mt-1">{loginErrors.password}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
              </button>
              <p className="font-sans text-xs text-brand-black/50 text-center pt-1">
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={() => setTab('register')} className="underline text-brand-black hover:opacity-60">
                  Regístrate
                </button>
              </p>
            </form>
          )}

          {/* ── Register form ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3" noValidate>
              <div>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={regName}
                  onChange={e => { setRegName(e.target.value); setRegErrors(p => ({...p, name:''})) }}
                  className={`input-brand ${regErrors.name ? 'border-red-500' : ''}`}
                  autoComplete="name"
                />
                {regErrors.name && <p className="font-sans text-xs text-red-500 mt-1">{regErrors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={regEmail}
                  onChange={e => { setRegEmail(e.target.value); setRegErrors(p => ({...p, email:''})) }}
                  className={`input-brand ${regErrors.email ? 'border-red-500' : ''}`}
                  autoComplete="email"
                />
                {regErrors.email && <p className="font-sans text-xs text-red-500 mt-1">{regErrors.email}</p>}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={regPassword}
                  onChange={e => { setRegPassword(e.target.value); setRegErrors(p => ({...p, password:''})) }}
                  className={`input-brand ${regErrors.password ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                {regErrors.password && <p className="font-sans text-xs text-red-500 mt-1">{regErrors.password}</p>}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={regConfirm}
                  onChange={e => { setRegConfirm(e.target.value); setRegErrors(p => ({...p, confirm:''})) }}
                  className={`input-brand ${regErrors.confirm ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                {regErrors.confirm && <p className="font-sans text-xs text-red-500 mt-1">{regErrors.confirm}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
              <p className="font-sans text-xs text-brand-black/50 text-center pt-1">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => setTab('login')} className="underline text-brand-black hover:opacity-60">
                  Inicia sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
