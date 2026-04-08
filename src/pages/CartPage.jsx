import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/shared/ProductCard'

const DEPARTMENTS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada',
]

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

export default function CartPage() {
  useEffect(() => { document.title = 'Tu Carrito | Bialy' }, [])
  const {
    items, removeFromCart, updateQuantity,
    subtotal, progressPercent, freeShippingRemaining,
  } = useCart()
  const navigate = useNavigate()

  const [note,          setNote]          = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [province,      setProvince]      = useState('')
  const [discountStatus,  setDiscountStatus]  = useState('idle') // idle | validating | applied | error
  const [discountData,    setDiscountData]    = useState(null)   // { code, amount, message }
  const [discountMsg,     setDiscountMsg]     = useState('')

  async function applyDiscount() {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setDiscountStatus('validating')
    setDiscountMsg('')
    try {
      const res  = await fetch('/api/admin?action=validate-discount', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code, subtotal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      if (data.valid) {
        setDiscountData({ code, amount: data.discount_amount, message: data.message })
        setDiscountStatus('applied')
        setDiscountMsg(data.message)
      } else {
        setDiscountData(null)
        setDiscountStatus('error')
        setDiscountMsg(data.message || 'Código no válido')
      }
    } catch {
      setDiscountStatus('error')
      setDiscountMsg('Error al validar el código')
    }
  }

  function removeDiscount() {
    setDiscountData(null)
    setDiscountStatus('idle')
    setDiscountInput('')
    setDiscountMsg('')
  }

  const discountAmount = discountData?.amount ?? 0
  const cartTotal      = subtotal - discountAmount

  const { products: recommended } = useProducts({ limit: 4 })
  const shippingFree = subtotal >= 180000

  if (items.length === 0) return <EmptyCart />

  return (
    <div className="container-brand py-8 md:py-14">
      <h1 className="font-display text-2xl md:text-3xl tracking-heading mb-8">Tu carrito</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-start">

        {/* ── Left column ─────────────────────────────────────────── */}
        <div>

          {/* Free shipping progress */}
          <div className="bg-brand-gray px-5 py-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-sans text-sm text-brand-black/70 flex-1 pr-3">
                {freeShippingRemaining === 0
                  ? '¡Tienes Envío GRATIS! 🎉'
                  : (
                    <>
                      ¡Añade <strong>{fmt(freeShippingRemaining)}</strong> más y consigue Envío GRATIS!
                    </>
                  )
                }
              </p>
              <span className="font-sans text-[0.6rem] uppercase tracking-button text-brand-black/40 whitespace-nowrap flex-shrink-0">
                Envío Gratis
              </span>
            </div>
            <div className="h-[3px] bg-brand-border w-full">
              <div
                className="h-full bg-brand-black transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Product table */}
          <div className="border-t border-brand-border">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[1fr_150px_100px] gap-4 py-3 border-b border-brand-border">
              <span className="font-sans text-[0.65rem] uppercase tracking-button text-brand-black/40">Producto</span>
              <span className="font-sans text-[0.65rem] uppercase tracking-button text-brand-black/40 text-center">Cantidad</span>
              <span className="font-sans text-[0.65rem] uppercase tracking-button text-brand-black/40 text-right">Total</span>
            </div>

            {/* Product rows */}
            {items.map(item => (
              <div
                key={`${item.id}-${item.size}-${item.color}`}
                className="grid md:grid-cols-[1fr_150px_100px] gap-4 py-5 border-b border-brand-border items-start"
              >
                {/* Product info */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-brand-gray overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <p className="font-sans text-xs uppercase tracking-button font-semibold mb-1 leading-snug">
                      {item.name}
                    </p>
                    <p className="font-sans text-xs text-brand-black/50 mb-0.5">{fmt(item.price)}</p>
                    {item.size && (
                      <p className="font-sans text-xs text-brand-black/50">Talla: {item.size}</p>
                    )}
                    {item.color && (
                      <p className="font-sans text-xs text-brand-black/50 flex items-center gap-1">
                        Color:
                        <span
                          className="w-3 h-3 rounded-full border border-brand-border inline-block"
                          style={{ background: item.color }}
                        />
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex flex-col items-start md:items-center gap-2">
                  <div className="flex items-center">
                    <button
                      onClick={() => updateQuantity(item.id, item.size, item.color, -1)}
                      className="w-9 h-9 flex items-center justify-center border border-brand-border font-sans text-base hover:bg-brand-gray transition-colors"
                    >
                      −
                    </button>
                    <span className="font-sans text-sm w-10 h-9 flex items-center justify-center border-t border-b border-brand-border">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.size, item.color, 1)}
                      className="w-9 h-9 flex items-center justify-center border border-brand-border font-sans text-base hover:bg-brand-gray transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                    className="font-sans text-xs text-brand-black/40 underline underline-offset-2 hover:text-brand-black transition-colors"
                  >
                    Quitar
                  </button>
                </div>

                {/* Line total */}
                <div className="text-left md:text-right">
                  <span className="font-sans text-sm font-semibold">
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Order note */}
          <div className="mt-8">
            <label className="font-sans text-sm font-semibold text-brand-black block mb-2">
              Añadir nota al pedido
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="¿Cómo podemos ayudarte?"
              rows={3}
              className="input-brand resize-none"
            />
          </div>

          {/* Shipping calculator */}
          <div className="mt-8 pt-8 border-t border-brand-border">
            <h3 className="font-sans text-sm font-semibold text-brand-black mb-4">
              Calcular gastos de envío
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3">
              <select className="input-brand">
                <option value="CO">Colombia</option>
              </select>
              <select
                className="input-brand"
                value={province}
                onChange={e => setProvince(e.target.value)}
              >
                <option value="">Provincia</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
              <input type="text" placeholder="Código postal" className="input-brand" />
              <button className="btn-primary whitespace-nowrap">Calcular</button>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-28 space-y-4">

          {/* Discount code */}
          {discountStatus === 'applied' ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3">
              <div>
                <p className="font-sans text-xs font-semibold text-green-800 uppercase tracking-button">{discountData.code}</p>
                <p className="font-sans text-xs text-green-700">{discountMsg}</p>
              </div>
              <button onClick={removeDiscount} className="font-sans text-xs text-green-700 underline hover:text-green-900">Quitar</button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código de descuento"
                  value={discountInput}
                  onChange={e => { setDiscountInput(e.target.value.toUpperCase()); if (discountStatus === 'error') setDiscountStatus('idle') }}
                  onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                  className="input-brand flex-1 uppercase"
                />
                <button
                  onClick={applyDiscount}
                  disabled={discountStatus === 'validating'}
                  className="btn-ghost whitespace-nowrap disabled:opacity-60"
                >
                  {discountStatus === 'validating' ? '…' : 'Aplicar'}
                </button>
              </div>
              {discountStatus === 'error' && (
                <p className="font-sans text-xs text-red-500">{discountMsg}</p>
              )}
            </div>
          )}

          {/* Order summary */}
          <div className="border border-brand-border p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-brand-black/60">Subtotal</span>
              <span className="font-sans text-sm font-semibold">{fmt(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-700">
                <span className="font-sans text-sm">Descuento ({discountData.code})</span>
                <span className="font-sans text-sm font-semibold">−{fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-brand-black/60">Envío</span>
              <span className={`font-sans text-sm font-semibold ${shippingFree ? 'text-green-700' : ''}`}>
                {shippingFree ? 'GRATIS' : 'Calculado al finalizar'}
              </span>
            </div>
            <div className="border-t border-brand-border pt-3 flex justify-between items-baseline">
              <span className="font-sans text-base font-bold">Total</span>
              <span className="font-sans text-xl font-bold">
                <span className="text-xs font-normal text-brand-black/50 mr-1">COP</span>
                {fmt(cartTotal)}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout', { state: discountData ? { discountCode: discountData.code } : undefined })}
            className="btn-primary w-full text-center"
          >
            Finalizar compra
          </button>
        </div>
      </div>

      {/* ── Recommended products ─────────────────────────────────── */}
      {recommended.length > 0 && (
        <section className="mt-16 md:mt-20 pt-10 border-t border-brand-border">
          <h2 className="font-display text-2xl md:text-3xl tracking-heading mb-8 lowercase">
            productos recomendados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommended.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} aosDelay={i * 60} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="container-brand py-24 text-center">
      <svg
        className="mx-auto mb-6 text-brand-black/20"
        width="56" height="56" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <h2 className="font-display text-2xl tracking-heading mb-3">Tu carrito está vacío</h2>
      <p className="font-sans text-sm text-brand-black/50 mb-8">
        Descubre nuestras colecciones y encuentra algo que te encante.
      </p>
      <Link to="/collections/nueva-coleccion" className="btn-primary">
        Ver colecciones
      </Link>
    </div>
  )
}
