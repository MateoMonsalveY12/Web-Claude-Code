import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

// ─── Wompi API base URL (determined from public key prefix — no VITE_WOMPI_ENV needed) ─
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY ?? ''
const WOMPI_API_BASE   = WOMPI_PUBLIC_KEY.startsWith('pub_prod_')
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1'

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

// ── Status icons ──────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  )
}

function IconX() {
  return (
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
  )
}

function IconClock() {
  return (
    <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
  )
}

function IconSpinner() {
  return (
    <div className="w-16 h-16 rounded-full bg-brand-gray flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-border border-t-brand-black rounded-full animate-spin" />
    </div>
  )
}

// ── Order summary sub-components ──────────────────────────────────────────────
function OrderItems({ items }) {
  if (!items?.length) return null
  return (
    <div>
      <h2 className="font-sans text-sm font-bold uppercase tracking-button mb-4 pb-3 border-b border-brand-border">
        Resumen del pedido
      </h2>
      <div className="divide-y divide-brand-border border border-brand-border">
        {items.map((item, i) => (
          <div key={`${item.id}-${item.size}-${i}`} className="flex items-center gap-4 px-4 py-3">
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
              <p className="font-sans text-xs uppercase tracking-button font-semibold leading-snug line-clamp-2">
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
  )
}

function OrderTotals({ order }) {
  if (!order) return null
  const shippingCost = order.shippingCost ?? 0
  const total        = order.total ?? (order.subtotal + shippingCost)
  return (
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
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams()
  const { clearCart }  = useCart()

  // ?id= is the Wompi transaction ID — Wompi appends it on redirect back
  // We only read 'id'. Any extra params Wompi adds (env, etc.) are ignored.
  const transactionId = searchParams.get('id')

  // Retrieve order persisted in localStorage before the Wompi redirect
  const [order] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bialy-pending-order') || 'null') }
    catch { return null }
  })

  // 'loading' | 'APPROVED' | 'DECLINED' | 'PENDING' | 'VOIDED' | 'ERROR' | 'no_id'
  const [status,  setStatus]  = useState('loading')
  const [txData,  setTxData]  = useState(null)
  const savedRef = useRef(false) // prevents duplicate Supabase saves on re-render

  // ── Save order to Supabase (fire-and-forget, never blocks UX) ─────────────
  async function persistOrder(tx, localOrder) {
    if (savedRef.current) return
    savedRef.current = true

    try {
      const body = {
        wompi_transaction_id: tx?.id       ?? transactionId,
        wompi_reference:      tx?.reference ?? localOrder?.reference ?? '',
        status:               tx?.status   ?? 'APPROVED',
        total_amount:         tx?.amount_in_cents
                                ? tx.amount_in_cents / 100
                                : localOrder?.total ?? 0,
        customer_name:  localOrder ? `${localOrder.firstName ?? ''} ${localOrder.lastName ?? ''}`.trim() : '',
        customer_email: localOrder?.email ?? '',
        customer_phone: localOrder?.phone ?? '',
        shipping_address: {
          address: localOrder?.address ?? '',
          apt:     localOrder?.apt     ?? '',
          city:    localOrder?.city    ?? '',
          state:   localOrder?.state   ?? '',
        },
        shipping_option: localOrder?.shippingLabel ?? localOrder?.shipping ?? '',
        shipping_cost:   localOrder?.shippingCost ?? 0,
        ...(localOrder?.customerId ? { customer_id: localOrder.customerId } : {}),
        items: (localOrder?.items ?? []).map(i => ({
          name:       i.name,
          slug:       i.slug,
          size:       i.size,
          color:      i.color,
          quantity:   i.quantity,
          price:      i.price,
        })),
      }

      const res = await fetch('/api/save-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (res.ok) {
        console.log('[OrderConfirmation] Orden guardada en Supabase:', json.order_id)
      } else {
        console.warn('[OrderConfirmation] No se pudo guardar en Supabase:', json.error)
      }
    } catch (err) {
      console.warn('[OrderConfirmation] Supabase save error (non-blocking):', err.message)
    }
  }

  useEffect(() => {
    document.title = 'Confirmación de pedido | Bialy'

    // Always discard the pending order — it belongs to this specific attempt
    localStorage.removeItem('bialy-pending-order')

    // No Wompi transaction ID → can't verify; assume success if order data exists
    if (!transactionId) {
      if (order) {
        clearCart()
        setStatus('APPROVED')
        persistOrder(null, order)
      } else {
        setStatus('no_id')
      }
      return
    }

    async function fetchTxStatus() {
      try {
        const res = await fetch(`${WOMPI_API_BASE}/transactions/${transactionId}`, {
          headers: WOMPI_PUBLIC_KEY
            ? { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` }
            : {},
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()
        const tx   = json?.data ?? json  // handle both { data: {...} } and flat response
        setTxData(tx)

        const txStatus = tx?.status ?? 'ERROR'
        setStatus(txStatus)

        // Clear cart and persist to Supabase on confirmed payments
        if (txStatus === 'APPROVED' || txStatus === 'PENDING') {
          clearCart()
          persistOrder(tx, order)
        }
      } catch (err) {
        console.error('[OrderConfirmation] Error al consultar transacción:', err.message)
        // Graceful fallback: if we have local order data, show approved
        if (order) {
          clearCart()
          setStatus('APPROVED')
          persistOrder(null, order)
        } else {
          setStatus('ERROR')
        }
      }
    }

    fetchTxStatus()
  }, [transactionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-status UI config ──────────────────────────────────────────────────
  const STATUS_UI = {
    loading: {
      icon:     <IconSpinner />,
      label:    'Un momento…',
      heading:  'Verificando pago',
      body:     'Consultando el estado de tu transacción.',
      headingClass: 'text-brand-black',
    },
    APPROVED: {
      icon:     <IconCheck />,
      label:    'Pago confirmado',
      heading:  '¡Gracias por tu compra!',
      body:     'Tu pedido ha sido confirmado. Te enviaremos un correo con el seguimiento.',
      headingClass: 'text-brand-black',
    },
    PENDING: {
      icon:     <IconClock />,
      label:    'Pago en revisión',
      heading:  'Tu pago está siendo procesado',
      body:     'El pago está pendiente de confirmación. Te avisaremos por correo en cuanto se apruebe.',
      headingClass: 'text-amber-700',
    },
    DECLINED: {
      icon:     <IconX />,
      label:    'Pago rechazado',
      heading:  'No se pudo procesar el pago',
      body:     txData?.status_message || 'La transacción fue rechazada por el medio de pago. Puedes intentarlo de nuevo.',
      headingClass: 'text-red-600',
    },
    VOIDED: {
      icon:     <IconX />,
      label:    'Pago anulado',
      heading:  'Transacción anulada',
      body:     'Esta transacción fue anulada.',
      headingClass: 'text-red-600',
    },
    ERROR: {
      icon:     <IconClock />,
      label:    'Estado no disponible',
      heading:  'No pudimos verificar el pago',
      body:     'Si completaste el pago, recibirás confirmación por correo. Si tienes dudas, contáctanos.',
      headingClass: 'text-amber-700',
    },
    no_id: {
      icon:     <IconClock />,
      label:    'Sin datos de transacción',
      heading:  'No encontramos tu pedido',
      body:     'Si realizaste un pago, revisa tu correo electrónico para la confirmación.',
      headingClass: 'text-amber-700',
    },
  }

  const ui = STATUS_UI[status] ?? STATUS_UI.ERROR

  const showSummary  = status !== 'loading' && order
  const showDeclined = status === 'DECLINED' || status === 'VOIDED'
  const showCTAs     = status !== 'loading' && !showDeclined

  return (
    <div className="min-h-screen bg-white">

      {/* ── Minimal header ── */}
      <header className="border-b border-brand-border">
        <div className="max-w-[640px] mx-auto px-5 py-4 flex items-center justify-center">
          <Link
            to="/"
            className="font-display tracking-[0.22em] text-[1.75rem] md:text-[2rem] uppercase text-brand-black"
          >
            BIALY
          </Link>
        </div>
      </header>

      <div className="max-w-[640px] mx-auto px-5 py-12 md:py-16 space-y-8">

        {/* ── Status hero ── */}
        <div className="flex flex-col items-center text-center gap-4">
          {ui.icon}

          <div>
            <p className="font-sans text-[0.68rem] text-brand-black/40 uppercase tracking-button mb-1.5">
              {ui.label}
            </p>
            <h1
              className={`font-display tracking-heading ${ui.headingClass}`}
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.1 }}
            >
              {ui.heading}
            </h1>
            <p className="font-sans text-sm text-brand-black/60 mt-2.5 max-w-[360px] mx-auto leading-relaxed">
              {ui.body}
            </p>
          </div>

          {/* Reference IDs */}
          <div className="space-y-1">
            {order?.reference && (
              <p className="font-sans text-[0.68rem] text-brand-black/35 uppercase tracking-button">
                Pedido: {order.reference}
              </p>
            )}
            {transactionId && status !== 'loading' && (
              <p className="font-sans text-[0.68rem] text-brand-black/35 uppercase tracking-button">
                Transacción: {transactionId}
              </p>
            )}
          </div>
        </div>

        {/* ── Info box: email + shipping (approved / pending) ── */}
        {(status === 'APPROVED' || status === 'PENDING') && order && (
          <div className="bg-brand-gray p-5 space-y-2">
            <p className="font-sans text-sm text-brand-black/70">
              Enviaremos confirmación a{' '}
              <span className="font-semibold text-brand-black">{order.email || 'tu correo'}</span>.
            </p>
            {order.shippingLabel && (
              <p className="font-sans text-sm text-brand-black/70">
                <span className="font-semibold text-brand-black">Método de entrega:</span>{' '}
                {order.shippingLabel}
              </p>
            )}
          </div>
        )}

        {/* ── DECLINED / VOIDED: retry CTA ── */}
        {showDeclined && (
          <div className="border border-red-200 bg-red-50 p-5 text-center space-y-3">
            <p className="font-sans text-sm text-red-700">
              Puedes intentar nuevamente con otro método de pago.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/checkout" className="btn-primary">
                Intentar de nuevo
              </Link>
              <Link to="/" className="btn-ghost">
                Ir al inicio
              </Link>
            </div>
          </div>
        )}

        {/* ── Order items + totals ── */}
        {showSummary && <OrderItems items={order.items} />}
        {showSummary && <OrderTotals order={order} />}

        {/* ── Shipping address ── */}
        {showSummary && order.address && (
          <div className="border border-brand-border p-4">
            <h3 className="font-sans text-xs font-bold uppercase tracking-button mb-2">
              Dirección de envío
            </h3>
            <p className="font-sans text-sm text-brand-black/70 leading-relaxed">
              {order.firstName} {order.lastName}<br />
              {order.address}{order.apt ? `, ${order.apt}` : ''}<br />
              {order.city}, {order.state}
            </p>
          </div>
        )}

        {/* ── Primary CTAs (approved / pending / error) ── */}
        {showCTAs && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/collections/nueva-coleccion" className="btn-primary flex-1 text-center py-3.5">
              Seguir comprando
            </Link>
            <Link to="/" className="btn-ghost flex-1 text-center py-3.5">
              Ir al inicio
            </Link>
          </div>
        )}

        {/* ── Footer note ── */}
        <p className="font-sans text-xs text-center text-brand-black/35 pb-4">
          ¿Tienes preguntas sobre tu pedido?{' '}
          <a href="#" className="underline underline-offset-2 hover:text-brand-black transition-colors">
            Contáctanos
          </a>
        </p>

      </div>
    </div>
  )
}
