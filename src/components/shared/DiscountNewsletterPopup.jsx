import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const SESSION_KEY = 'bialy-popup-dismissed'

export default function DiscountNewsletterPopup() {
  const { pathname } = useLocation()
  const [visible,   setVisible]   = useState(false)
  const [email,     setEmail]     = useState('')
  const [status,    setStatus]    = useState('idle') // idle | subscribing | success | already | error
  const [coupon,    setCoupon]    = useState('')
  const timerRef = useRef(null)

  // Don't show on checkout or admin pages
  const blocked = pathname.startsWith('/checkout') || pathname.startsWith('/admin') || pathname === '/order-confirmation'

  useEffect(() => {
    if (blocked) return
    if (sessionStorage.getItem(SESSION_KEY)) return

    // 2-minute timer trigger
    timerRef.current = setTimeout(() => setVisible(true), 2 * 60 * 1000)

    // Exit intent: mouse moves near top edge of viewport (desktop only).
    // Two guards prevent false triggers:
    //   1. hasEnteredPage — cursor must have moved past clientY > 100 at least once
    //      (prevents triggering when user arrives on the page from the browser chrome)
    //   2. 30-second minimum — exit intent cannot fire in the first 30s regardless
    //      (prevents triggering when user briefly scrolls up or moves to the address bar
    //      shortly after arriving on the page)
    const activatedAt = Date.now()
    const EXIT_INTENT_MIN_MS = 30 * 1000
    let hasEnteredPage = false
    function onMouseMove(e) {
      if (e.clientY > 100) hasEnteredPage = true
      if (
        hasEnteredPage &&
        e.clientY < 20 &&
        Date.now() - activatedAt > EXIT_INTENT_MIN_MS &&
        !sessionStorage.getItem(SESSION_KEY)
      ) {
        clearTimeout(timerRef.current)
        setVisible(true)
      }
    }
    document.addEventListener('mousemove', onMouseMove)

    return () => {
      clearTimeout(timerRef.current)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [blocked])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  async function handleSubscribe(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('subscribing')
    try {
      const res  = await fetch('/api/admin?action=newsletter-subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), source: 'popup' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      if (data.status === 'already_subscribed') {
        setStatus('already')
      } else {
        setCoupon(data.coupon_code || '')
        setStatus('success')
      }
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      setStatus('error')
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Descuento de bienvenida">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} aria-hidden="true" />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-md shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-brand-black/40 hover:text-brand-black transition-colors"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {status === 'success' ? (
          /* ── Success state ── */
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-gray border border-brand-border flex items-center justify-center mx-auto mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-black">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="eyebrow mb-3">¡Bienvenida!</p>
            <h2 className="font-display text-2xl tracking-heading mb-3">Tu 10% OFF</h2>
            <p className="font-sans text-sm text-brand-black/60 mb-5 leading-relaxed">
              Hemos enviado el código a tu correo. Úsalo al finalizar tu primera compra.
            </p>
            {coupon && (
              <div className="border-2 border-dashed border-brand-border p-4 mb-5 bg-brand-gray">
                <p className="font-sans text-xs text-brand-black/50 mb-1 uppercase tracking-button">Tu código</p>
                <p className="font-display text-xl tracking-heading text-brand-black">{coupon}</p>
              </div>
            )}
            <button
              onClick={dismiss}
              className="btn-primary w-full text-center"
            >
              Ir a la tienda
            </button>
          </div>
        ) : status === 'already' ? (
          /* ── Already subscribed ── */
          <div className="p-8 text-center">
            <p className="eyebrow mb-3">Ya estás suscrita</p>
            <h2 className="font-display text-xl tracking-heading mb-3">Revisa tu correo</h2>
            <p className="font-sans text-sm text-brand-black/60 mb-5 leading-relaxed">
              Ya tienes un código de descuento activo. Revisa tu bandeja de entrada.
            </p>
            <button onClick={dismiss} className="btn-primary w-full text-center">Entendido</button>
          </div>
        ) : (
          /* ── Default form ── */
          <>
            {/* Decorative top strip */}
            <div className="h-1.5 bg-brand-black" />
            <div className="p-8">
              <p className="eyebrow mb-3 text-center">Oferta exclusiva</p>
              <h2 className="font-display text-3xl tracking-heading text-center mb-2">10% OFF</h2>
              <p className="font-sans text-sm text-brand-black/60 text-center mb-6 leading-relaxed">
                Suscríbete y recibe un código de descuento exclusivo para tu primera compra.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3" noValidate>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input-brand w-full"
                  autoFocus
                />
                {status === 'error' && (
                  <p className="font-sans text-xs text-red-500">Algo salió mal. Inténtalo de nuevo.</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'subscribing'}
                  className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {status === 'subscribing' && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {status === 'subscribing' ? 'Un momento…' : 'Obtener mi descuento'}
                </button>
              </form>
              <button
                onClick={dismiss}
                className="w-full mt-3 font-sans text-xs text-brand-black/40 hover:text-brand-black text-center transition-colors"
              >
                No, gracias
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
