import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()

  // Read Wompi redirect params (?id=transactionId)
  const transactionId = searchParams.get('id')

  // Read order saved before redirect to Wompi
  const [order] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bialy-pending-order') || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    document.title = 'Pedido Confirmado | Bialy'
    // Clear cart and pending order after mounting
    clearCart()
    localStorage.removeItem('bialy-pending-order')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // No order data at all — probably navigated here directly
  if (!order && !transactionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-5">
        <p className="font-sans text-sm text-brand-black/50">No se encontró información del pedido.</p>
        <Link to="/collections/nueva-coleccion" className="btn-primary">
          Ver colecciones
        </Link>
      </div>
    )
  }

  const shippingCost = order?.shippingCost ?? 0
  const total        = order?.total ?? (order?.subtotal ? order.subtotal + shippingCost : 0)

  return (
    <div className="min-h-screen bg-white">
      {/* ── Clean header ── */}
      <header className="border-b border-brand-border">
        <div className="max-w-[640px] mx-auto px-5 py-4 flex items-center justify-center">
          <Link
            to="/"
            className="font-display tracking-[0.22em] text-[1.75rem] md:text-[2rem] uppercase text-brand-black"
          >
            TU MARCA
          </Link>
        </div>
      </header>

      <div className="max-w-[640px] mx-auto px-5 py-12 md:py-16 space-y-8">

        {/* ── Check mark ── */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="font-sans text-sm text-brand-black/50 uppercase tracking-button mb-1">
              Pedido recibido
            </p>
            <h1
              className="font-display tracking-heading text-brand-black"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.1 }}
            >
              ¡Gracias por tu compra!
            </h1>
          </div>
          {order?.reference && (
            <p className="font-sans text-xs text-brand-black/40 uppercase tracking-button">
              Pedido: {order.reference}
            </p>
          )}
        </div>

        {/* ── Confirmation info ── */}
        <div className="bg-brand-gray p-5 space-y-2">
          <p className="font-sans text-sm text-brand-black/70">
            Te enviaremos un correo de confirmación a{' '}
            <span className="font-semibold text-brand-black">{order?.email || 'tu correo'}</span>
            {' '}con el resumen de tu pedido y el número de seguimiento cuando despachemos.
          </p>
          {order?.shippingLabel && (
            <p className="font-sans text-sm text-brand-black/70">
              <span className="font-semibold text-brand-black">Método de entrega:</span>{' '}
              {order.shippingLabel}
            </p>
          )}
        </div>

        {/* ── Products list ── */}
        {order?.items?.length > 0 && (
          <div>
            <h2 className="font-sans text-sm font-bold uppercase tracking-button mb-4 pb-3 border-b border-brand-border">
              Resumen del pedido
            </h2>
            <div className="divide-y divide-brand-border border border-brand-border">
              {order.items.map((item, i) => (
                <div
                  key={`${item.id}-${item.size}-${i}`}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-brand-gray overflow-hidden">
                      <img
                        src={item.image || '/images/product-1.jpg'}
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
                      <p className="font-sans text-[0.7rem] text-brand-black/50 mt-0.5 flex items-center gap-1">
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
          </div>
        )}

        {/* ── Totals ── */}
        {order && (
          <div className="space-y-2.5 pt-2 border-t border-brand-border">
            <div className="flex justify-between">
              <span className="font-sans text-sm text-brand-black/60">Subtotal</span>
              <span className="font-sans text-sm">{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-sm text-brand-black/60">Envío</span>
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
        )}

        {/* ── Shipping address ── */}
        {order?.address && (
          <div className="border border-brand-border p-4">
            <h3 className="font-sans text-xs font-bold uppercase tracking-button mb-2">Dirección de envío</h3>
            <p className="font-sans text-sm text-brand-black/70">
              {order.firstName} {order.lastName}<br />
              {order.address}{order.apt ? `, ${order.apt}` : ''}<br />
              {order.city}, {order.state}
            </p>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/collections/nueva-coleccion" className="btn-primary flex-1 text-center py-3.5">
            Seguir comprando
          </Link>
          <Link to="/" className="btn-ghost flex-1 text-center py-3.5">
            Ir al inicio
          </Link>
        </div>

        {/* ── Footer note ── */}
        <p className="font-sans text-xs text-center text-brand-black/35 pb-4">
          ¿Necesitas ayuda?{' '}
          <a href="#" className="underline underline-offset-2 hover:text-brand-black transition-colors">
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  )
}
