import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import BialyLogo from '../components/shared/BialyLogo.jsx'
import CouponInput from '../components/cart/CouponInput.jsx'

// ─── Wompi environment ─────────────────────────────────────────────────────
// VITE_WOMPI_ENV controls which environment is active: "sandbox" | "production"
// VITE_WOMPI_PUBLIC_KEY must match the environment:
//   sandbox    → pub_stagtest_...
//   production → pub_prod_...
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY ?? ''
const WOMPI_ENV        = import.meta.env.VITE_WOMPI_ENV ?? 'sandbox'

/**
 * Wompi integrity signature — ALWAYS via Vercel serverless /api/wompi-signature.
 *
 * The backend reads process.env.WOMPI_INTEGRITY_SECRET (no VITE_ prefix).
 * The secret never reaches the browser.
 *
 * Formula (computed server-side):
 *   SHA256(reference + amountInCents + "COP" + WOMPI_INTEGRITY_SECRET)
 *
 * Required env vars:
 *   Vercel → WOMPI_INTEGRITY_SECRET   (server-only, no VITE_ prefix)
 *   Vercel → VITE_WOMPI_PUBLIC_KEY    (public, safe for browser)
 *
 * To switch sandbox → production:
 *   1. Get prod keys from wompi.co → Dashboard → Desarrolladores → Llaves
 *   2. Update Vercel env vars: VITE_WOMPI_PUBLIC_KEY + WOMPI_INTEGRITY_SECRET
 *   3. Re-deploy — no code changes needed
 */
async function getWompiSignature(reference, amountInCents) {
  const res = await fetch('/api/wompi-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, amountInCents: String(amountInCents), currency: 'COP' }),
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { msg = (await res.json()).error || msg } catch { /* ignore */ }
    throw new Error(`/api/wompi-signature falló: ${msg}`)
  }

  const { signature } = await res.json()
  return signature
}

const DEPARTMENTS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada',
]

// Only carrier shipping — no pickup points
const FREE_SHIPPING_THRESHOLD = 180000
const CARRIER_COST            = 15000
const CARRIER_LABEL           = 'Coordinadora — 3 a 7 días hábiles'

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

export default function CheckoutPage() {
  const { items, subtotal, cartCount, couponData, discountAmount, applyDiscount, revalidateCoupon } = useCart()
  const { user, getShippingProfile, saveShippingProfile } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => { document.title = 'Checkout | Bialy' }, [])

  /* ── Form state ── */
  const [email,      setEmail]      = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [docType,    setDocType]    = useState('CC')
  const [docNumber,  setDocNumber]  = useState('')
  const [address,    setAddress]    = useState('')
  const [apt,        setApt]        = useState('')
  const [city,       setCity]       = useState('')
  const [state,      setState]      = useState('')
  const [postal,     setPostal]     = useState('')
  const [phone,      setPhone]      = useState('')
  const [saveInfo,   setSaveInfo]   = useState(false)
  const [billing,    setBilling]    = useState(true)
  const [processing,  setProcessing]  = useState(false)
  const prevEmailRef = useRef('')

  // Pre-fill ALL fields from customer_profiles when user is logged in
  useEffect(() => {
    if (!user) return
    // Always pre-fill email from auth
    setEmail(user.email ?? '')
    getShippingProfile().then(profile => {
      if (!profile) return
      if (profile.first_name)      setFirstName(profile.first_name)
      if (profile.last_name)       setLastName(profile.last_name)
      if (profile.phone)           setPhone(profile.phone)
      if (profile.document_type)   setDocType(profile.document_type)
      if (profile.document_number) setDocNumber(profile.document_number)
      if (profile.address_line1)   setAddress(profile.address_line1)
      if (profile.address_line2)   setApt(profile.address_line2)
      if (profile.city)            setCity(profile.city)
      if (profile.state)           setState(profile.state)
      if (profile.postal_code)     setPostal(profile.postal_code)
      setSaveInfo(true) // profile exists → default checkbox ON
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Auto-apply if code arrived via location.state (legacy route from CartPage)
  useEffect(() => {
    if (location.state?.discountCode) applyDiscount(location.state.discountCode, '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-validate applied coupon when email changes (email-restricted codes)
  useEffect(() => {
    const trimmed = email.trim()
    if (trimmed && trimmed !== prevEmailRef.current) {
      prevEmailRef.current = trimmed
      revalidateCoupon(trimmed)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  /* ── Inline field validation errors ── */
  const [errors, setErrors] = useState({})
  const clearErr = key => setErrors(prev => ({ ...prev, [key]: '' }))

  // Shipping: free above threshold, otherwise flat carrier cost
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : CARRIER_COST
  const total        = subtotal + shippingCost - discountAmount

  async function handlePayment(e) {
    e.preventDefault()

    // ── Inline field validation (no alert boxes) ──────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const newErrors = {}
    if (!email.trim())                       newErrors.email     = 'Ingresa tu correo electrónico'
    else if (!emailRegex.test(email.trim())) newErrors.email     = 'Ingresa un correo electrónico válido'
    if (!firstName.trim())                   newErrors.firstName = 'Este campo es obligatorio'
    if (!lastName.trim())                    newErrors.lastName  = 'Este campo es obligatorio'
    if (!docType)                            newErrors.docType   = 'Este campo es obligatorio'
    if (!docNumber.trim())                   newErrors.docNumber = 'Este campo es obligatorio'
    if (!address.trim())                     newErrors.address   = 'Ingresa tu dirección de envío'
    if (!city.trim())                        newErrors.city      = 'Ingresa tu ciudad'
    if (!state)                              newErrors.state     = 'Este campo es obligatorio'
    if (!phone.trim())                       newErrors.phone     = 'Ingresa tu número de teléfono'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to first red field automatically
      setTimeout(() => {
        document.querySelector('[data-field-error="true"]')?.scrollIntoView({
          behavior: 'smooth', block: 'center',
        })
      }, 50)
      return
    }

    setProcessing(true)

    // Unique order reference
    const reference = `BIALY-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
    // Wompi requires amount in COP centavos (COP × 100)
    const amountInCents = Math.round(total * 100)

    // ── Wompi environment guard ──────────────────────────────────────────────
    const publicKey = WOMPI_PUBLIC_KEY

    if (!publicKey) {
      console.error('[Wompi] VITE_WOMPI_PUBLIC_KEY no está configurada. Agrega VITE_WOMPI_PUBLIC_KEY al archivo .env')
      setErrors({ _global: 'Error de configuración de pago. Contacta al administrador.' })
      setProcessing(false)
      return
    }

    // Validate key prefix matches declared environment (prevents accidental cross-env calls)
    // Wompi sandbox keys start with pub_test_ or pub_stagtest_; production keys with pub_prod_
    const isSandboxKey = publicKey.startsWith('pub_test_') || publicKey.startsWith('pub_stagtest_')
    const isProdKey    = publicKey.startsWith('pub_prod_')
    if (WOMPI_ENV === 'sandbox' && !isSandboxKey) {
      console.warn('[Wompi] ADVERTENCIA: VITE_WOMPI_ENV=sandbox pero la llave no comienza con pub_test_ ni pub_stagtest_')
    }
    if (WOMPI_ENV === 'production' && !isProdKey) {
      console.warn('[Wompi] ADVERTENCIA: VITE_WOMPI_ENV=production pero la llave no comienza con pub_prod_')
    }
    if (!isSandboxKey && !isProdKey) {
      console.error('[Wompi] Llave pública inválida — debe comenzar con pub_stagtest_ o pub_prod_')
      setErrors({ _global: 'Llave de pago inválida. Contacta al administrador.' })
      setProcessing(false)
      return
    }

    console.log(`[Wompi] env=${WOMPI_ENV} | key=${publicKey.slice(0, 20)}... | amount=${amountInCents} | ref=${reference}`)

    // Save shipping profile if checkbox is checked (fire-and-forget)
    if (saveInfo && user) {
      saveShippingProfile({
        first_name:      firstName.trim(),
        last_name:       lastName.trim(),
        email:           email.trim(),
        phone:           phone.trim(),
        document_type:   docType,
        document_number: docNumber.trim(),
        address_line1:   address.trim(),
        address_line2:   apt.trim(),
        city:            city.trim(),
        state,
        postal_code:     postal.trim(),
      })
    }

    // Persist order for confirmation page (before redirect — Wompi clears React state)
    localStorage.setItem('bialy-pending-order', JSON.stringify({
      reference,
      items: items.map(i => ({ ...i })),
      subtotal,
      shippingCost,
      discountCode:   couponData?.code || null,
      discountAmount: discountAmount   || 0,
      total,
      shippingLabel:  CARRIER_LABEL,
      email:     email.trim(),
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      address:   address.trim(),
      apt:       apt.trim(),
      city:      city.trim(),
      state,
      phone:     phone.trim(),
      createdAt: new Date().toISOString(),
    }))

    try {
      // Signature: SHA256(reference + amountInCents + "COP" + secret)
      // Computed server-side via /api/wompi-signature (fallback: client-side in dev)
      const signature = await getWompiSignature(reference, amountInCents)

      const wompiBase  = 'https://checkout.wompi.co/p/'
      // redirectTo must be a clean URL with NO query params — Wompi appends ?id=... on return
      const redirectTo = `${window.location.origin}/order-confirmation`

      const params = new URLSearchParams()
      params.set('public-key',              publicKey)
      params.set('currency',                'COP')
      params.set('amount-in-cents',         String(amountInCents))
      params.set('reference',               reference)
      params.set('signature:integrity',     signature)
      params.set('redirect-url',            redirectTo)
      params.set('customer-data:full-name', `${firstName.trim()} ${lastName.trim()}`)
      params.set('customer-data:email',     email.trim())
      params.set('customer-data:phone-number', `57${phone.replace(/\D/g, '').slice(-10)}`)

      console.log(`[Wompi] Redirigiendo → ${wompiBase}?public-key=${publicKey.slice(0,20)}...&amount-in-cents=${amountInCents}&reference=${reference}`)
      window.location.href = `${wompiBase}?${params.toString()}`
    } catch (err) {
      console.error('[Wompi] Error al iniciar pago:', err)
      setErrors({ _global: 'Hubo un error al iniciar el pago. Verifica tu conexión e intenta de nuevo.' })
      setProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-sans text-sm text-brand-black/50">Tu carrito está vacío.</p>
        <Link to="/collections" className="btn-primary">Ver colecciones</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Clean checkout header ── */}
      <header className="border-b border-brand-border">
        <div className="max-w-[1100px] mx-auto px-5 py-4 flex items-center">
          <div className="flex-1" />
          <Link to="/" aria-label="Bialy Colombia — Ir al inicio">
            <BialyLogo className="h-10 md:h-12 w-auto text-brand-black" />
          </Link>
          <div className="flex-1 flex justify-end">
            <Link to="/cart" className="relative p-1.5 text-brand-black hover:opacity-60 transition-opacity">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-black text-white text-[0.55rem] font-sans font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-5 py-8 md:py-12">
        <div className="grid lg:grid-cols-[55fr_45fr] gap-10 lg:gap-14 items-start">

          {/* ══════════════════════════════════════════════
              LEFT — Form
          ══════════════════════════════════════════════ */}
          <div className="space-y-8">

            {/* Contact */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-base font-bold">Contacto</h2>
                {!user && (
                  <button
                    type="button"
                    onClick={() => navigate('/cuenta/login', { state: { from: '/checkout' } })}
                    className="font-sans text-xs underline underline-offset-2 text-brand-black hover:opacity-60 transition-opacity"
                  >
                    Iniciar sesión
                  </button>
                )}
              </div>
              <div data-field-error={!!errors.email || undefined}>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearErr('email') }}
                  className={`input-brand ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.email && <p className="font-sans text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              {!user && (
                <p className="font-sans text-xs text-brand-black/50 mt-2 mb-1">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/cuenta/login', { state: { from: '/checkout' } })}
                    className="underline text-brand-black hover:opacity-60"
                  >
                    Inicia sesión para autocompletar tus datos
                  </button>
                </p>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={e => setNewsletter(e.target.checked)}
                  className="w-4 h-4 border-brand-border"
                />
                <span className="font-sans text-sm text-brand-black/70">
                  Enviarme novedades y ofertas por correo electrónico
                </span>
              </label>
            </section>

            {/* Shipping data */}
            <section>
              <h2 className="font-sans text-base font-bold mb-4">Datos para envío</h2>
              <div className="space-y-3">
                <select className="input-brand" value="CO" readOnly>
                  <option value="CO">Colombia</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div data-field-error={!!errors.firstName || undefined}>
                    <input
                      type="text" placeholder="Nombre"
                      value={firstName}
                      onChange={e => { setFirstName(e.target.value); clearErr('firstName') }}
                      className={`input-brand ${errors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.firstName && <p className="font-sans text-xs text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div data-field-error={!!errors.lastName || undefined}>
                    <input
                      type="text" placeholder="Apellidos"
                      value={lastName}
                      onChange={e => { setLastName(e.target.value); clearErr('lastName') }}
                      className={`input-brand ${errors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.lastName && <p className="font-sans text-xs text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 items-start">
                  <div data-field-error={!!errors.docType || undefined}>
                    <div className="relative">
                      <select
                        className={`input-brand appearance-none pr-8 ${errors.docType ? 'border-red-500 focus:border-red-500' : ''}`}
                        value={docType}
                        onChange={e => { setDocType(e.target.value); clearErr('docType') }}
                      >
                        <option value="CC">C.C.</option>
                        <option value="NIT">NIT</option>
                        <option value="CE">C.E.</option>
                        <option value="PAS">Pasaporte</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </span>
                    </div>
                    {errors.docType && <p className="font-sans text-xs text-red-500 mt-1">{errors.docType}</p>}
                  </div>
                  <div data-field-error={!!errors.docNumber || undefined}>
                    <input
                      type="text"
                      placeholder="Número de documento"
                      value={docNumber}
                      onChange={e => { setDocNumber(e.target.value); clearErr('docNumber') }}
                      className={`input-brand ${errors.docNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.docNumber && <p className="font-sans text-xs text-red-500 mt-1">{errors.docNumber}</p>}
                  </div>
                </div>
                <div data-field-error={!!errors.address || undefined}>
                  <input
                    type="text" placeholder="Dirección"
                    value={address}
                    onChange={e => { setAddress(e.target.value); clearErr('address') }}
                    className={`input-brand ${errors.address ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.address && <p className="font-sans text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
                <input
                  type="text" placeholder="Casa, apartamento, etc. (opcional)"
                  value={apt} onChange={e => setApt(e.target.value)}
                  className="input-brand"
                />
                <div className="grid grid-cols-3 gap-3 items-start">
                  <div data-field-error={!!errors.city || undefined}>
                    <input
                      type="text" placeholder="Ciudad"
                      value={city}
                      onChange={e => { setCity(e.target.value); clearErr('city') }}
                      className={`input-brand ${errors.city ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.city && <p className="font-sans text-xs text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div data-field-error={!!errors.state || undefined}>
                    <div className="relative">
                      <select
                        className={`input-brand appearance-none pr-8 ${errors.state ? 'border-red-500 focus:border-red-500' : ''}`}
                        value={state}
                        onChange={e => { setState(e.target.value); clearErr('state') }}
                      >
                        <option value="">Departamento</option>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </span>
                    </div>
                    {errors.state && <p className="font-sans text-xs text-red-500 mt-1">{errors.state}</p>}
                  </div>
                  <input
                    type="text" placeholder="Código postal (opci...)"
                    value={postal} onChange={e => setPostal(e.target.value)}
                    className="input-brand"
                  />
                </div>
                <div data-field-error={!!errors.phone || undefined}>
                  <div className="relative">
                    <input
                      type="tel" placeholder="Teléfono"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); clearErr('phone') }}
                      className={`input-brand pr-10 ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/30">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </span>
                  </div>
                  {errors.phone && <p className="font-sans text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
                {user ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveInfo}
                      onChange={e => setSaveInfo(e.target.checked)}
                      className="w-4 h-4 border-brand-border"
                    />
                    <span className="font-sans text-sm text-brand-black/70">
                      Guardar mi información para comprar más rápido la próxima vez
                    </span>
                  </label>
                ) : (
                  <p className="font-sans text-xs text-brand-black/40 leading-relaxed">
                    ¿Quieres guardar tus datos?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/cuenta/login', { state: { from: '/checkout' } })}
                      className="underline text-brand-black/60 hover:text-brand-black transition-colors"
                    >
                      Inicia sesión o crea una cuenta
                    </button>
                  </p>
                )}
              </div>
            </section>

            {/* Shipping method — single carrier, auto cost */}
            <section>
              <h2 className="font-sans text-base font-bold mb-4">Envío</h2>
              <div className="border border-brand-border flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-sans text-sm text-brand-black">Coordinadora</p>
                  <p className="font-sans text-xs text-brand-black/50">3 a 7 días hábiles</p>
                </div>
                <span className={`font-sans text-sm font-semibold ${shippingCost === 0 ? 'text-green-700' : ''}`}>
                  {shippingCost === 0 ? 'GRATIS' : fmt(shippingCost)}
                </span>
              </div>
              {shippingCost === 0 && (
                <p className="font-sans text-xs text-green-700 mt-1.5">
                  ¡Tu pedido califica para envío gratis!
                </p>
              )}
            </section>

            {/* Payment */}
            <section>
              <h2 className="font-sans text-base font-bold mb-1">Pago</h2>
              <p className="font-sans text-xs text-brand-black/50 mb-4">
                Todas las transacciones son seguras y están encriptadas.
              </p>
              <div className="border border-brand-border px-4 py-5">
                <div className="flex items-center gap-3 mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-brand-black/50 flex-shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <span className="font-sans text-sm text-brand-black/70">
                    Serás redirigido a Wompi para completar tu pago de forma segura.
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CardBadge>VISA</CardBadge>
                  <CardBadge>MC</CardBadge>
                  <CardBadge>AMEX</CardBadge>
                  <CardBadge>DINERS</CardBadge>
                  <CardBadge>PSE</CardBadge>
                  <CardBadge>Nequi</CardBadge>
                  <CardBadge>Bancolombia</CardBadge>
                  <CardBadge>Efecty</CardBadge>
                </div>
              </div>
            </section>

            {/* Billing checkbox */}
            <label className="flex items-center gap-2 cursor-pointer -mt-2">
              <input
                type="checkbox"
                checked={billing}
                onChange={e => setBilling(e.target.checked)}
                className="w-4 h-4 border-brand-border"
              />
              <span className="font-sans text-sm text-brand-black/70">
                Usar la dirección de envío como dirección de facturación
              </span>
            </label>

            {/* Global error (e.g. Wompi config missing) */}
            {errors._global && (
              <div className="bg-red-50 border border-red-200 px-4 py-3">
                <p className="font-sans text-sm text-red-700">{errors._global}</p>
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="btn-primary w-full text-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? 'Redirigiendo a Wompi…' : 'Pagar ahora'}
            </button>

            {/* Footer links */}
            <nav className="flex flex-wrap gap-x-5 gap-y-2 pt-2 border-t border-brand-border">
              {[
                'Política de reembolso','Envío','Política de privacidad',
                'Términos del servicio','Contacto',
              ].map(l => (
                <a
                  key={l} href="#"
                  className="font-sans text-xs text-brand-black/40 underline underline-offset-2 hover:text-brand-black transition-colors"
                >
                  {l}
                </a>
              ))}
            </nav>
          </div>

          {/* ══════════════════════════════════════════════
              RIGHT — Order summary
          ══════════════════════════════════════════════ */}
          <div className="lg:sticky lg:top-8 space-y-4">

            {/* Product list */}
            <div className="divide-y divide-brand-border border border-brand-border">
              {items.map(item => (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-brand-gray overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-black text-white text-[0.6rem] font-sans font-bold rounded-full flex items-center justify-center leading-none">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-xs uppercase tracking-button font-semibold leading-snug">
                      {item.name}
                    </p>
                    {(item.size || item.color) && (
                      <p className="font-sans text-[0.7rem] text-brand-black/50 flex items-center gap-1 mt-0.5">
                        {item.size && <span>{item.size}</span>}
                        {item.size && item.color && <span>/</span>}
                        {item.color && (
                          <span
                            className="w-3 h-3 rounded-full border border-brand-border inline-block"
                            style={{ background: item.color }}
                          />
                        )}
                      </p>
                    )}
                  </div>
                  <span className="font-sans text-sm font-semibold flex-shrink-0">
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Discount */}
            <CouponInput email={email} />

            {/* Summary */}
            <div className="space-y-2.5 pt-4 border-t border-brand-border">
              <div className="flex justify-between items-center">
                <span className="font-sans text-sm text-brand-black/60">Subtotal</span>
                <span className="font-sans text-sm">{fmt(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-700">
                  <span className="font-sans text-sm">Descuento ({couponData?.code})</span>
                  <span className="font-sans text-sm font-semibold">−{fmt(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-sans text-sm text-brand-black/60 flex items-center gap-1">
                  Envío
                  <span className="text-brand-black/30">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  </span>
                </span>
                <span className={`font-sans text-sm font-semibold ${shippingCost === 0 ? 'text-green-700' : ''}`}>
                  {shippingCost === 0 ? 'GRATIS' : fmt(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-brand-border">
                <span className="font-sans text-base font-bold">Total</span>
                <span className="font-sans text-xl font-bold">
                  <span className="text-xs font-normal text-brand-black/50 mr-1">COP</span>
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Small helpers ─────────────────────────────────────────── */

function CardBadge({ children, dark }) {
  return (
    <span className={`font-sans text-[0.6rem] font-semibold px-1.5 py-0.5 border ${
      dark
        ? 'bg-brand-black text-white border-brand-black'
        : 'border-brand-border text-brand-black/60'
    }`}>
      {children}
    </span>
  )
}
