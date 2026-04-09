import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/shared/ProductCard'
import CouponInput from '../components/cart/CouponInput.jsx'

const DEPARTMENTS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada',
]

const FREE_SHIPPING_THRESHOLD = 180000
const CARRIER_COST            = 15000

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

export default function CartPage() {
  useEffect(() => { document.title = 'Tu Carrito | Bialy' }, [])
  const {
    items, removeFromCart, updateQuantity,
    subtotal, progressPercent, freeShippingRemaining,
    couponData, discountAmount,
  } = useCart()
  const navigate = useNavigate()

  const [note,             setNote]             = useState('')
  const [province,         setProvince]         = useState('')
  const [shippingEstimate, setShippingEstimate] = useState(null)  // null | 0 | CARRIER_COST
  const [shippingCalcErr,  setShippingCalcErr]  = useState('')

  const cartTotal    = subtotal - discountAmount
  const shippingFree = subtotal >= FREE_SHIPPING_THRESHOLD

  const { products: recommended } = useProducts({ limit: 4 })

  function handleCalcShipping() {
    setShippingCalcErr('')
    if (!province) {
      setShippingCalcErr('Selecciona tu departamento para calcular el envío')
      return
    }
    const cost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : CARRIER_COST
    setShippingEstimate(cost)
    if (cost === 0) {
      console.log('[shipping:calc] Envío gratis aplicado (total > umbral)')
    } else {
      console.log(`[shipping:calc] Costo calculado para ${province}: ${fmt(cost)}`)
    }
  }

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
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <select
                className="input-brand"
                value={province}
                onChange={e => { setProvince(e.target.value); setShippingEstimate(null); setShippingCalcErr('') }}
              >
                <option value="">Selecciona tu departamento</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
              <button onClick={handleCalcShipping} className="btn-primary whitespace-nowrap">
                Calcular
              </button>
            </div>
            {shippingCalcErr && (
              <p className="font-sans text-xs text-red-500 mt-2">{shippingCalcErr}</p>
            )}
            {shippingEstimate !== null && (
              <div className={`mt-3 px-4 py-3 border flex items-center justify-between ${
                shippingEstimate === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-brand-gray border-brand-border'
              }`}>
                <div>
                  <p className={`font-sans text-sm font-semibold ${shippingEstimate === 0 ? 'text-green-800' : ''}`}>
                    {shippingEstimate === 0 ? '¡Envío GRATIS!' : fmt(shippingEstimate)}
                  </p>
                  <p className="font-sans text-xs text-brand-black/50">Coordinadora — 3 a 7 días hábiles</p>
                </div>
                {shippingEstimate === 0 && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-28 space-y-4">

          {/* Discount code */}
          <CouponInput />

          {/* Order summary */}
          <div className="border border-brand-border p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-brand-black/60">Subtotal</span>
              <span className="font-sans text-sm font-semibold">{fmt(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-700">
                <span className="font-sans text-sm">Descuento ({couponData?.code})</span>
                <span className="font-sans text-sm font-semibold">−{fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-brand-black/60">Envío</span>
              <span className={`font-sans text-sm font-semibold ${
                shippingFree || shippingEstimate === 0 ? 'text-green-700' : ''
              }`}>
                {shippingFree || shippingEstimate === 0
                  ? 'GRATIS'
                  : shippingEstimate != null
                    ? fmt(shippingEstimate)
                    : 'Calculado al finalizar'}
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
            onClick={() => navigate('/checkout')}
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
