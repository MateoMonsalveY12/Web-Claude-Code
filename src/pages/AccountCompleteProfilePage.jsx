import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AccountCompleteProfilePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [fullName,    setFullName]    = useState('')
  const [phone,       setPhone]       = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [errors,      setErrors]      = useState({})
  const [globalError, setGlobalError] = useState('')

  useEffect(() => { document.title = 'Completa tu perfil | Bialy' }, [])

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/cuenta/login', { replace: true })
  }, [loading, user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Ingresa tu nombre completo'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setGlobalError('')
    try {
      const { error } = await supabase.from('customers').upsert({
        email:     user.email,
        full_name: fullName.trim(),
        phone:     phone.trim() || null,
      }, { onConflict: 'email', ignoreDuplicates: false })

      if (error) throw error
      navigate('/mi-cuenta/pedidos', { replace: true })
    } catch (err) {
      setGlobalError('No se pudo guardar el perfil. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-border border-t-brand-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[380px]">

        <div className="text-center mb-8">
          <Link to="/" className="font-display tracking-[0.22em] text-[2rem] uppercase text-brand-black">
            BIALY
          </Link>
        </div>

        <div className="border border-brand-border p-8">
          <h1 className="font-display text-[1.3rem] tracking-[0.05em] text-brand-black mb-2 text-center">
            Completa tu perfil
          </h1>
          <p className="font-sans text-xs text-brand-black/50 text-center mb-6">
            {user.email}
          </p>

          {globalError && (
            <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">
              {globalError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <input
                type="text"
                placeholder="Nombre completo"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setErrors(p => ({...p, fullName:''})) }}
                className={`input-brand ${errors.fullName ? 'border-red-500' : ''}`}
                autoComplete="name"
                autoFocus
              />
              {errors.fullName && <p className="font-sans text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input-brand"
              autoComplete="tel"
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Guardando…' : 'Guardar y continuar'}
            </button>
          </form>

          <button
            onClick={() => navigate('/mi-cuenta/pedidos', { replace: true })}
            className="w-full mt-3 font-sans text-xs text-brand-black/40 hover:text-brand-black/70 transition-colors text-center"
          >
            Omitir por ahora
          </button>
        </div>
      </div>
    </div>
  )
}
