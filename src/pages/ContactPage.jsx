import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const WA_NUMBER = '573102232188'
const EMAIL     = 'hola@bialycol.shop'

const SUBJECTS = [
  { value: 'consulta-producto',   label: 'Consulta sobre un producto' },
  { value: 'estado-pedido',       label: 'Estado de mi pedido' },
  { value: 'cambio-devolucion',   label: 'Cambio o devolución' },
  { value: 'otro',                label: 'Otro' },
]

const SUBJECT_LABELS = Object.fromEntries(SUBJECTS.map(s => [s.value, s.label]))

const EMPTY_FORM = { name: '', email: '', subject: 'consulta-producto', message: '' }

function validate(form) {
  const errs = {}
  if (!form.name.trim())                                  errs.name    = 'Nombre requerido'
  if (!form.email.trim())                                 errs.email   = 'Email requerido'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Formato de email inválido'
  if (!form.subject)                                      errs.subject = 'Selecciona un asunto'
  if (!form.message.trim())                               errs.message = 'Mensaje requerido'
  else if (form.message.trim().length < 20)               errs.message = 'El mensaje debe tener al menos 20 caracteres'
  return errs
}

export default function ContactPage() {
  useEffect(() => { document.title = 'Contacto — Bialy Colombia' }, [])

  const [form,    setForm]    = useState(EMPTY_FORM)
  const [errors,  setErrors]  = useState({})
  const [status,  setStatus]  = useState('idle') // idle | sending | success | error
  const [apiError, setApiError] = useState('')

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setStatus('sending')
    setApiError('')
    try {
      const res  = await fetch('/api/emails?type=contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar el mensaje')
      setStatus('success')
      setForm(EMPTY_FORM)
    } catch (err) {
      setStatus('error')
      setApiError(err.message)
    }
  }

  const inputClass = (field) =>
    `w-full bg-brand-gray border font-sans text-sm px-4 py-3 rounded outline-none focus:border-brand-black/40 placeholder-brand-black/30 transition-colors ${
      errors[field] ? 'border-red-400' : 'border-brand-border'
    }`

  return (
    <div className="bg-brand-white min-h-screen">
      {/* Hero */}
      <section className="bg-brand-gray border-b border-brand-border -mt-24 md:-mt-28">
        <div className="container-brand pt-28 md:pt-36 pb-10 md:pb-14">
          <p className="eyebrow mb-3">Contacto</p>
          <h1 className="section-title">Hablemos.</h1>
          <p className="font-sans text-brand-black/55 mt-2 max-w-sm leading-relaxed">
            Responderemos en menos de 24 horas.
          </p>
        </div>
      </section>

      <div className="container-brand py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 max-w-5xl">

          {/* ── Left column — info ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Contact items */}
            <div className="space-y-5">
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-start gap-4 group"
              >
                <span className="w-10 h-10 rounded-full bg-brand-gray border border-brand-border flex items-center justify-center shrink-0 group-hover:border-brand-black/30 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-black/40 mb-0.5">Email</p>
                  <p className="font-sans text-sm text-brand-black group-hover:underline transition-all">{EMAIL}</p>
                </div>
              </a>

              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group"
              >
                <span className="w-10 h-10 rounded-full bg-brand-gray border border-brand-border flex items-center justify-center shrink-0 group-hover:border-green-500/50 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-black/40 mb-0.5">WhatsApp</p>
                  <p className="font-sans text-sm text-brand-black group-hover:underline">310 223 2188</p>
                </div>
              </a>

              <div className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-full bg-brand-gray border border-brand-border flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-black/40 mb-0.5">Horario</p>
                  <p className="font-sans text-sm text-brand-black">Lunes a viernes</p>
                  <p className="font-sans text-sm text-brand-black/55">9:00 am – 6:00 pm</p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="border-t border-brand-border pt-6 space-y-2.5">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-black/40 mb-3">Links rápidos</p>
              {[
                { label: 'Preguntas frecuentes', to: '/faq', icon: '?' },
                { label: 'Política de devoluciones', to: '/terminos', icon: '↩' },
                { label: 'Guía de tallas', to: '/guia-tallas', icon: '📏' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 font-sans text-sm text-brand-black/55 hover:text-brand-black transition-colors group"
                >
                  <span className="w-6 h-6 rounded bg-brand-gray border border-brand-border text-brand-black/40 text-xs flex items-center justify-center shrink-0 group-hover:border-brand-black/30 transition-colors">
                    {link.icon}
                  </span>
                  {link.label} →
                </Link>
              ))}
            </div>
          </div>

          {/* ── Right column — form ─────────────────────────────────── */}
          <div className="lg:col-span-3">
            {status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 border border-green-300 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 className="font-sans text-base font-semibold text-brand-black mb-2">¡Mensaje enviado!</h2>
                <p className="font-sans text-sm text-brand-black/60 leading-relaxed">
                  Te responderemos pronto en <strong className="text-brand-black">{form.email || 'tu email'}</strong>.
                  Revisamos mensajes de lunes a viernes, 9am – 6pm.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 font-sans text-xs font-semibold uppercase tracking-button text-brand-black/50 hover:text-brand-black underline transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div>
                      <p className="font-sans text-sm text-red-700 font-medium">No se pudo enviar el mensaje</p>
                      <p className="font-sans text-xs text-red-600 mt-0.5">{apiError || 'Inténtalo de nuevo o escríbenos directamente a hola@bialycol.shop'}</p>
                    </div>
                  </div>
                )}

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-brand-black/50 mb-1.5">
                      Nombre completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text" value={form.name} autoComplete="name"
                      onChange={e => setField('name', e.target.value)}
                      placeholder="Valentina García"
                      className={inputClass('name')}
                    />
                    {errors.name && <p className="font-sans text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-brand-black/50 mb-1.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email" value={form.email} autoComplete="email"
                      onChange={e => setField('email', e.target.value)}
                      placeholder="tu@correo.com"
                      className={inputClass('email')}
                    />
                    {errors.email && <p className="font-sans text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-brand-black/50 mb-1.5">
                    Asunto <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.subject}
                    onChange={e => setField('subject', e.target.value)}
                    className={inputClass('subject')}
                  >
                    {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {errors.subject && <p className="font-sans text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-brand-black/50 mb-1.5">
                    Mensaje <span className="text-red-400">*</span>
                    <span className="ml-2 font-normal normal-case text-brand-black/30">(mín. 20 caracteres)</span>
                  </label>
                  <textarea
                    rows={5} value={form.message}
                    onChange={e => setField('message', e.target.value)}
                    placeholder="Cuéntanos cómo podemos ayudarte…"
                    className={`${inputClass('message')} resize-none`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.message
                      ? <p className="font-sans text-xs text-red-500">{errors.message}</p>
                      : <span />
                    }
                    <p className={`font-sans text-xs ${form.message.length >= 20 ? 'text-brand-black/30' : 'text-brand-black/20'}`}>
                      {form.message.length} / 20
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {status === 'sending' && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {status === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
                </button>

                <p className="font-sans text-xs text-brand-black/35 text-center leading-relaxed">
                  También puedes escribirnos directamente a{' '}
                  <a href={`mailto:${EMAIL}`} className="underline hover:text-brand-black">{EMAIL}</a>
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
