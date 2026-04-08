import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  // If already authenticated, redirect
  useEffect(() => {
    fetch('/api/admin/check', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.authenticated) navigate('/admin', { replace: true }) })
      .catch(() => {})
  }, [])

  useEffect(() => { document.title = 'Admin — Bialy' }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ password }),
      })
      const json = await res.json()
      if (res.ok) {
        navigate('/admin', { replace: true })
      } else {
        setError(json.error ?? 'Contraseña incorrecta')
        setPassword('')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl tracking-widest text-white mb-1">BIALY</h1>
          <p className="font-sans text-xs text-slate-500 uppercase tracking-widest">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-8 space-y-5">
          <div>
            <label className="font-sans text-xs text-slate-400 uppercase tracking-widest block mb-2">
              Contraseña de acceso
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
              placeholder="••••••••••••"
              className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-4 py-3 rounded outline-none focus:border-slate-400 transition-colors placeholder-slate-600"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800/50 text-red-400 font-sans text-sm px-3 py-2.5 rounded flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-white text-slate-900 font-sans text-sm font-semibold py-3 rounded hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center font-sans text-xs text-slate-700 mt-6">
          Acceso restringido — solo personal autorizado
        </p>
      </div>
    </div>
  )
}
