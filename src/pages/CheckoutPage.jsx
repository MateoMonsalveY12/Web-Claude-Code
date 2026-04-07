import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

/**
 * Wompi integrity signature helper.
 *
 * 1. Tries the Vercel serverless function /api/wompi-signature (production).
 * 2. Falls back to client-side SHA-256 using VITE_WOMPI_INTEGRITY_SECRET
 *    (sandbox / local dev — that env var is safe to expose for test keys only).
 *
 * TO SWITCH TO PRODUCTION:
 *   - Set VITE_WOMPI_PUBLIC_KEY  = pub_prod_...
 *   - Set WOMPI_INTEGRITY_SECRET = prod_integrity_... (server-only Vercel env var)
 *   - Remove VITE_WOMPI_INTEGRITY_SECRET from production env vars
 */
async function getWompiSignature(reference, amountInCents) {
  try {
    const res = await fetch('/api/wompi-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, amountInCents: String(amountInCents), currency: 'COP' }),
    })
    if (res.ok) {
      const { signature } = await res.json()
      return signature
    }
  } catch { /* fall through */ }

  // Client-side fallback for sandbox / local dev
  const secret = import.meta.env.VITE_WOMPI_INTEGRITY_SECRET
  if (!secret) throw new Error('Wompi integrity secret not available. Set VITE_WOMPI_INTEGRITY_SECRET in .env for local dev.')
  const msg = `${reference}${amountInCents}COP${secret}`
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const DEPARTMENTS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada',
]

const SHIPPING_OPTIONS = [
  { id: 'fabrica',      label: 'Recoge en TU MARCA Punto de Fábrica',  price: 0 },
  { id: 'laureles',     label: 'Recoge en Tienda TU MARCA Laureles',   price: 0 },
  { id: 'oviedo',       label: 'Recoge en Tienda TU MARCA Oviedo',     price: 0 },
  { id: 'sandiego',     label: 'Recoge en Tienda TU MARCA Sandiego',   price: 0 },
  { id: 'coordinadora', label: 'Coordinadora',                         price: 15000, sublabel: '3 a 7 días hábiles' },
]

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

export default function CheckoutPage() {
  const { items, subtotal, cartCount } = useCart()
  const navigate = useNavigate()

  useEffect(() => { document.title = 'Checkout | Bialy' }, [])

  /* ── Form state ── */
  const [email,      setEmail]      = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [cedula,     setCedula]     = useState('')
  const [cedulaErr,  setCedulaErr]  = useState('')
  const [address,    setAddress]    = useState('')
  const [apt,        setApt]        = useState('')
  const [city,       setCity]       = useState('')
  const [state,      setState]      = useState('Antioquia')
  const [postal,     setPostal]     = useState('')
  const [phone,      setPhone]      = useState('')
  const [saveInfo,   setSaveInfo]   = useState(false)
  const [billing,    setBilling]    = useState(true)

  const [shipping,   setShipping]   = useState('fabrica')
  const [payment,    setPayment]    = useState('credit')
  const [discount,    setDiscount]    = useState('')
  const [processing,  setProcessing]  = useState(false)

  /* ── Inline field validation errors ── */
  const [errors, setErrors] = useState({})
  const clearErr = key => setErrors(prev => ({ ...prev, [key]: '' }))

  /* Credit card sub-form */
  const [cardNum,     setCardNum]     = useState('')
  const [cardExpiry,  setCardExpiry]  = useState('')
  const [cardCvv,     setCardCvv]     = useState('')
  const [cardHolder,  setCardHolder]  = useState('')
  const [docType,     setDocType]     = useState('C.C.')
  const [docNumber,   setDocNumber]   = useState('')
  const [installments,setInstallments]= useState('')

  const shippingCost = SHIPPING_OPTIONS.find(o => o.id === shipping)?.price ?? 0
  const total = subtotal + shippingCost

  async function handlePayment(e) {
    e.preventDefault()

    // ── Inline field validation (no alert boxes) ──────────────────
    const newErrors = {}
    if (!email.trim())     newErrors.email     = 'Ingresa tu correo electrónico'
    if (!firstName.trim()) newErrors.firstName = 'Este campo es obligatorio'
    if (!lastName.trim())  newErrors.lastName  = 'Este campo es obligatorio'
    if (cedulaErr)         newErrors.cedula    = cedulaErr
    if (!address.trim())   newErrors.address   = 'Ingresa tu dirección de envío'
    if (!city.trim())      newErrors.city      = 'Ingresa tu ciudad'
    if (!phone.trim())     newErrors.phone     = 'Ingresa tu número de teléfono'

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

    // Debug logs — confirm values before sending to Wompi
    console.log('[Wompi] Public key:', import.meta.env.VITE_WOMPI_PUBLIC_KEY)
    console.log('[Wompi] Amount in cents:', amountInCents)
    console.log('[Wompi] Reference:', reference)

    // Guard: public key must be set
    const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY
    if (!publicKey) {
      console.error('[Wompi] VITE_WOMPI_PUBLIC_KEY is not set. Add it to your .env file.')
      setErrors({ _global: 'Error de configuración de pago. Contacta al administrador.' })
      setProcessing(false)
      return
    }

    // Persist order for confirmation page (before redirect — Wompi clears React state)
    localStorage.setItem('bialy-pending-order', JSON.stringify({
      reference,
      items: items.map(i => ({ ...i })),
      subtotal,
      shippingCost,
      total,
      shipping,
      shippingLabel: SHIPPING_OPTIONS.find(o => o.id === shipping)?.label,
      email: email.trim(),
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

      console.log('[Wompi] Redirecting to:', `${wompiBase}?public-key=${publicKey}&amount-in-cents=${amountInCents}&reference=${reference}`)
      window.location.href = `${wompiBase}?${params.toString()}`
    } catch (err) {
      console.error('[Wompi] Error al iniciar pago:', err)
      setErrors({ _global: 'Hubo un error al iniciar el pago. Verifica tu conexión e intenta de nuevo.' })
      setProcessing(false)
    }
  }

  function handleCedula(val) {
    if (val && !/^\d*$/.test(val)) {
      setCedulaErr('Este campo solo puede contener números.')
      setErrors(prev => ({ ...prev, cedula: 'Este campo solo puede contener números.' }))
    } else {
      setCedulaErr('')
      clearErr('cedula')
    }
    setCedula(val)
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
          <Link
            to="/"
            className="font-display tracking-[0.22em] text-[1.75rem] md:text-[2rem] uppercase text-brand-black"
          >
            TU MARCA
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
                <Link to="/" className="font-sans text-xs underline underline-offset-2 text-brand-black hover:opacity-60 transition-opacity">
                  Iniciar sesión
                </Link>
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
                <div data-field-error={!!errors.cedula || undefined}>
                  <input
                    type="text"
                    placeholder="Cédula / NIT"
                    value={cedula}
                    onChange={e => handleCedula(e.target.value)}
                    className={`input-brand ${errors.cedula ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.cedula && (
                    <p className="font-sans text-xs text-red-500 mt-1">{errors.cedula}</p>
                  )}
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
                  <div className="relative">
                    <select
                      className="input-brand appearance-none pr-8"
                      value={state}
                      onChange={e => setState(e.target.value)}
                    >
                      <option value="">Provincia / Estado</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveInfo}
                    onChange={e => setSaveInfo(e.target.checked)}
                    className="w-4 h-4 border-brand-border"
                  />
                  <span className="font-sans text-sm text-brand-black/70">
                    Guardar mi información y consultar más rápidamente la próxima vez
                  </span>
                </label>
              </div>
            </section>

            {/* Shipping method */}
            <section>
              <h2 className="font-sans text-base font-bold mb-4">Métodos de envío</h2>
              <div className="border border-brand-border divide-y divide-brand-border">
                {SHIPPING_OPTIONS.map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                      shipping === opt.id ? 'bg-brand-gray' : 'hover:bg-brand-gray/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Custom radio */}
                      <div className="w-4 h-4 rounded-full border-2 border-brand-black flex items-center justify-center flex-shrink-0">
                        {shipping === opt.id && (
                          <div className="w-2 h-2 rounded-full bg-brand-black" />
                        )}
                      </div>
                      <div>
                        <p className="font-sans text-sm text-brand-black">{opt.label}</p>
                        {opt.sublabel && (
                          <p className="font-sans text-xs text-brand-black/50">{opt.sublabel}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-sans text-sm font-semibold ml-4 flex-shrink-0">
                      {opt.price === 0 ? 'GRATIS' : fmt(opt.price)}
                    </span>
                    <input
                      type="radio" name="shipping" value={opt.id}
                      checked={shipping === opt.id}
                      onChange={() => setShipping(opt.id)}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="font-sans text-base font-bold mb-1">Pago</h2>
              <p className="font-sans text-xs text-brand-black/50 mb-4">
                Todas las transacciones son seguras y están encriptadas.
              </p>
              <div className="border border-brand-border divide-y divide-brand-border">

                {/* Tarjeta de crédito */}
                <div>
                  <label className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${payment === 'credit' ? 'bg-brand-gray' : 'hover:bg-brand-gray/50'}`}>
                    <div className="flex items-center gap-3">
                      <RadioDot active={payment === 'credit'} />
                      <span className="font-sans text-sm">Tarjeta de crédito</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-4">
                      <CardBadge>VISA</CardBadge>
                      <CardBadge>MC</CardBadge>
                      <CardBadge>AMEX</CardBadge>
                      <CardBadge>DINERS</CardBadge>
                    </div>
                    <input type="radio" name="payment" value="credit" checked={payment === 'credit'} onChange={() => setPayment('credit')} className="sr-only" />
                  </label>
                  {payment === 'credit' && (
                    <div className="bg-brand-gray px-4 pb-5 pt-3 space-y-3">
                      <div className="relative">
                        <input
                          type="text" placeholder="Número de tarjeta"
                          value={cardNum} onChange={e => setCardNum(e.target.value)}
                          className="input-brand pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/30">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                          </svg>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text" placeholder="Fecha de vencimiento (MM / AA)"
                          value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                          className="input-brand"
                        />
                        <div className="relative">
                          <input
                            type="text" placeholder="Código de seguridad"
                            value={cardCvv} onChange={e => setCardCvv(e.target.value)}
                            className="input-brand pr-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/30">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                          </span>
                        </div>
                      </div>
                      <input
                        type="text" placeholder="Nombre del titular"
                        value={cardHolder} onChange={e => setCardHolder(e.target.value)}
                        className="input-brand"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <select
                            className="input-brand appearance-none pr-8"
                            value={docType} onChange={e => setDocType(e.target.value)}
                          >
                            <option>C.C.</option><option>NIT</option>
                            <option>C.E.</option><option>Pasaporte</option>
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                          </span>
                        </div>
                        <input
                          type="text" placeholder="Número de documento"
                          value={docNumber} onChange={e => setDocNumber(e.target.value)}
                          className="input-brand"
                        />
                      </div>
                      <div className="relative">
                        <select
                          className="input-brand appearance-none pr-8"
                          value={installments} onChange={e => setInstallments(e.target.value)}
                        >
                          <option value="">Cuotas</option>
                          {[1,2,3,6,12,18,24,36].map(n => (
                            <option key={n} value={n}>{n} {n === 1 ? 'cuota' : 'cuotas'}</option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                      </div>
                      <p className="font-sans text-xs text-brand-black/40">
                        Si hay intereses, los aplicará y cobrará tu banco.
                      </p>
                    </div>
                  )}
                </div>

                {/* PSE */}
                <label className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${payment === 'pse' ? 'bg-brand-gray' : 'hover:bg-brand-gray/50'}`}>
                  <div className="flex items-center gap-3">
                    <RadioDot active={payment === 'pse'} />
                    <span className="font-sans text-sm">Paga con PSE, Tarjetas o en Efectivo</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4">
                    <CardBadge>PSE</CardBadge>
                    <span className="font-sans text-xs text-brand-black/40">+2</span>
                  </div>
                  <input type="radio" name="payment" value="pse" checked={payment === 'pse'} onChange={() => setPayment('pse')} className="sr-only" />
                </label>

                {/* Sistecredito */}
                <label className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${payment === 'sistecredito' ? 'bg-brand-gray' : 'hover:bg-brand-gray/50'}`}>
                  <div className="flex items-center gap-3">
                    <RadioDot active={payment === 'sistecredito'} />
                    <span className="font-sans text-sm">Sistecredito</span>
                  </div>
                  <span className="font-sans text-xs text-brand-black/50 ml-4 border border-brand-border px-2 py-0.5">sistecredito</span>
                  <input type="radio" name="payment" value="sistecredito" checked={payment === 'sistecredito'} onChange={() => setPayment('sistecredito')} className="sr-only" />
                </label>

                {/* Addi */}
                <label className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${payment === 'addi' ? 'bg-brand-gray' : 'hover:bg-brand-gray/50'}`}>
                  <div className="flex items-center gap-3">
                    <RadioDot active={payment === 'addi'} />
                    <span className="font-sans text-sm">Addi</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4">
                    <CardBadge dark>Addi</CardBadge>
                    <CardBadge>PSE</CardBadge>
                  </div>
                  <input type="radio" name="payment" value="addi" checked={payment === 'addi'} onChange={() => setPayment('addi')} className="sr-only" />
                </label>

                {/* Transferencia */}
                <label className={`flex items-center px-4 py-3.5 cursor-pointer transition-colors ${payment === 'transfer' ? 'bg-brand-gray' : 'hover:bg-brand-gray/50'}`}>
                  <div className="flex items-center gap-3">
                    <RadioDot active={payment === 'transfer'} />
                    <span className="font-sans text-sm">Pago por transferencia bancaria</span>
                  </div>
                  <input type="radio" name="payment" value="transfer" checked={payment === 'transfer'} onChange={() => setPayment('transfer')} className="sr-only" />
                </label>
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
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de descuento"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="input-brand flex-1"
              />
              <button className="btn-ghost whitespace-nowrap">Aplicar</button>
            </div>

            {/* Summary */}
            <div className="space-y-2.5 pt-4 border-t border-brand-border">
              <div className="flex justify-between items-center">
                <span className="font-sans text-sm text-brand-black/60">Subtotal</span>
                <span className="font-sans text-sm">{fmt(subtotal)}</span>
              </div>
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

function RadioDot({ active }) {
  return (
    <div className="w-4 h-4 rounded-full border-2 border-brand-black flex items-center justify-center flex-shrink-0">
      {active && <div className="w-2 h-2 rounded-full bg-brand-black" />}
    </div>
  )
}

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
