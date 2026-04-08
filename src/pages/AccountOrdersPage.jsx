import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ReviewModal from '../components/account/ReviewModal.jsx'

/* ── Wompi payment status ─────────────────────────────────────── */
const PAYMENT_STATUS = {
  APPROVED: { text: 'Aprobado',  color: 'text-green-700  bg-green-50  border-green-200' },
  PENDING:  { text: 'Pendiente', color: 'text-amber-700  bg-amber-50  border-amber-200' },
  DECLINED: { text: 'Rechazado', color: 'text-red-700    bg-red-50    border-red-200'   },
  VOIDED:   { text: 'Anulado',   color: 'text-red-700    bg-red-50    border-red-200'   },
  ERROR:    { text: 'Error',     color: 'text-red-700    bg-red-50    border-red-200'   },
}

/* ── Order lifecycle status ───────────────────────────────────── */
const ORDER_STATUS = {
  PAGO_APROBADO: { text: 'Pago aprobado', color: 'text-blue-700   bg-blue-50   border-blue-200'   },
  EMPACANDO:     { text: 'Empacando',     color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  EN_CAMINO:     { text: 'En camino',     color: 'text-orange-700 bg-orange-50 border-orange-200' },
  ENTREGADO:     { text: 'Entregado',     color: 'text-green-700  bg-green-50  border-green-200'  },
}

function fmt(n) { return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO') }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status, map }) {
  const s = map[status] ?? { text: status, color: 'text-brand-black/50 bg-brand-gray border-brand-border' }
  return (
    <span className={`font-sans text-xs font-semibold px-2 py-1 border ${s.color}`}>
      {s.text}
    </span>
  )
}

/* ── Order detail panel ───────────────────────────────────────── */
function OrderDetail({ order, customerId, customerName, onReviewSubmitted }) {
  const [items,   setItems]   = useState(null) // null = not yet fetched
  const [loading, setLoading] = useState(false)
  const [reviewModal, setReviewModal] = useState(null) // { product }
  const [reviewedSlugs, setReviewedSlugs] = useState(new Set())

  const addr = order.shipping_address ?? {}
  const isDelivered = order.order_status === 'ENTREGADO'
  const isShipping  = order.order_status === 'EN_CAMINO'

  useEffect(() => {
    if (!supabase) return
    setLoading(true)
    supabase
      .from('order_items')
      .select('id, product_name, product_slug, size, color, quantity, unit_price, subtotal')
      .eq('order_id', order.id)
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })

    // Check which products have already been reviewed
    if (customerId) {
      supabase
        .from('reviews')
        .select('product_slug')
        .eq('order_id', order.id)
        .then(({ data }) => {
          if (data) setReviewedSlugs(new Set(data.map(r => r.product_slug)))
        })
    }
  }, [order.id, customerId])

  return (
    <div className="border-t border-brand-border mt-4 pt-4 space-y-5">
      {/* Tracking */}
      {(isShipping || isDelivered) && order.tracking_number && (
        <div className="bg-orange-50 border border-orange-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-orange-600 shrink-0">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <div>
              <p className="font-sans text-xs text-orange-700/70 uppercase tracking-button">Número de guía</p>
              <p className="font-sans text-sm font-semibold text-orange-800">{order.tracking_number}</p>
            </div>
          </div>
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs font-semibold uppercase tracking-button bg-orange-600 text-white px-4 py-2 hover:bg-orange-700 transition-colors"
            >
              Rastrear envío
            </a>
          )}
        </div>
      )}

      {/* Products */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-brand-border border-t-brand-black rounded-full animate-spin" />
        </div>
      )}
      {items && items.length > 0 && (
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-button mb-3 text-brand-black/50">Productos</p>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-start gap-4 py-3 border-b border-brand-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium truncate">{item.product_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.size  && <span className="font-sans text-xs text-brand-black/50">Talla: {item.size}</span>}
                    {item.color && <span className="font-sans text-xs text-brand-black/50">Color: {item.color}</span>}
                    <span className="font-sans text-xs text-brand-black/50">Cant: {item.quantity}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-sans text-sm">{fmt(item.subtotal ?? item.unit_price * item.quantity)}</p>
                  <p className="font-sans text-xs text-brand-black/40">{fmt(item.unit_price)} c/u</p>
                </div>
                {/* Review button — only when delivered */}
                {isDelivered && (
                  <button
                    onClick={() => setReviewModal({
                      product: {
                        slug:  item.product_slug,
                        name:  item.product_name,
                        image: null,
                      }
                    })}
                    disabled={reviewedSlugs.has(item.product_slug)}
                    className={`shrink-0 font-sans text-xs font-semibold uppercase tracking-button px-3 py-1.5 border transition-colors ${
                      reviewedSlugs.has(item.product_slug)
                        ? 'border-brand-border text-brand-black/30 cursor-default'
                        : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-white'
                    }`}
                  >
                    {reviewedSlugs.has(item.product_slug) ? 'Reseñado' : 'Reseñar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Address + shipping */}
      <div className="grid sm:grid-cols-2 gap-4">
        {(addr.address || addr.city) && (
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-button mb-1 text-brand-black/50">Dirección de envío</p>
            <p className="font-sans text-sm text-brand-black/70 leading-relaxed">
              {[addr.address, addr.apt, addr.city, addr.state, addr.postal_code]
                .filter(Boolean).join(', ')}
            </p>
          </div>
        )}
        {order.shipping_option && (
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-button mb-1 text-brand-black/50">Método de envío</p>
            <p className="font-sans text-sm text-brand-black/70">{order.shipping_option}</p>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="bg-brand-gray px-4 py-3 space-y-1.5">
        <div className="flex justify-between font-sans text-sm">
          <span className="text-brand-black/60">Subtotal</span>
          <span>{fmt((order.total_amount ?? 0) - (order.shipping_cost ?? 0))}</span>
        </div>
        {order.shipping_cost != null && (
          <div className="flex justify-between font-sans text-sm">
            <span className="text-brand-black/60">Envío</span>
            <span>{order.shipping_cost === 0 ? 'Gratis' : fmt(order.shipping_cost)}</span>
          </div>
        )}
        <div className="flex justify-between font-sans text-sm font-semibold border-t border-brand-border/50 pt-1.5 mt-1.5">
          <span>Total pagado</span>
          <span>{fmt(order.total_amount)}</span>
        </div>
      </div>

      {/* Reference & date */}
      <div className="font-sans text-xs text-brand-black/35 space-y-0.5">
        <p>Referencia: {order.wompi_reference || order.id}</p>
        <p>Fecha: {formatDate(order.created_at)}</p>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          isOpen
          onClose={() => setReviewModal(null)}
          orderId={order.id}
          customerId={customerId}
          customerName={customerName}
          product={reviewModal.product}
          onSuccess={() => {
            setReviewedSlugs(prev => new Set([...prev, reviewModal.product.slug]))
            onReviewSubmitted?.()
          }}
        />
      )}
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────── */
export default function AccountOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [expanded, setExpanded] = useState(null) // order id
  const [customerId, setCustomerId] = useState(null)

  useEffect(() => { document.title = 'Mis pedidos | Bialy' }, [])

  useEffect(() => {
    if (!authLoading && !user) navigate('/', { replace: true })
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user || !supabase) return

    // Fetch customer id for review modal
    supabase
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => { if (data) setCustomerId(data.id) })

    setLoading(true)
    supabase
      .from('orders')
      .select(`
        id, wompi_reference, status, order_status,
        total_amount, shipping_cost, created_at,
        shipping_option, shipping_address, customer_name,
        tracking_number, tracking_url, delivered_at
      `)
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[AccountOrders]', error.message)
          setError('No se pudieron cargar tus pedidos.')
        } else {
          setOrders(data ?? [])
        }
        setLoading(false)
      })
  }, [user])

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-border border-t-brand-black rounded-full animate-spin" />
      </div>
    )
  }

  const customerName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || ''

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[900px] mx-auto px-5 py-10 md:py-14">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-sans text-xl font-bold">Mis pedidos</h1>
            <p className="font-sans text-sm text-brand-black/50 mt-0.5">{user.email}</p>
          </div>
          <Link to="/" className="font-sans text-xs underline underline-offset-2 text-brand-black/50 hover:text-brand-black">
            Seguir comprando
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-border border-t-brand-black rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 px-4 py-3">
            <p className="font-sans text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="font-sans text-sm text-brand-black/50">Aún no tienes pedidos.</p>
            <Link to="/collections" className="btn-primary inline-block">
              Ver colecciones
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map(order => {
              const isOpen = expanded === order.id
              const orderStatusBadge = ORDER_STATUS[order.order_status]
                ?? ORDER_STATUS['PAGO_APROBADO']

              return (
                <div key={order.id} className="border border-brand-border">
                  {/* Order summary row — clickable to expand */}
                  <button
                    className="w-full text-left p-5"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-sans text-xs text-brand-black/40 uppercase tracking-button mb-0.5">
                          Pedido #{order.wompi_reference?.split('-').slice(-1)[0] ?? order.id.slice(0,8).toUpperCase()}
                        </p>
                        <p className="font-sans text-sm font-semibold">{fmt(order.total_amount)}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Lifecycle badge (primary) */}
                        <span className={`font-sans text-xs font-semibold px-2 py-1 border ${orderStatusBadge.color}`}>
                          {orderStatusBadge.text}
                        </span>
                        {/* Payment status (secondary) */}
                        <StatusBadge status={order.status} map={PAYMENT_STATUS} />
                        <span className="font-sans text-xs text-brand-black/40">
                          {new Date(order.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {/* Expand chevron */}
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms' }}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>

                    {/* Shipping summary (collapsed view) */}
                    {!isOpen && order.shipping_option && (
                      <p className="font-sans text-xs text-brand-black/50 mt-2">
                        Envío: {order.shipping_option}
                      </p>
                    )}
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <OrderDetail
                        order={order}
                        customerId={customerId}
                        customerName={customerName}
                        onReviewSubmitted={() => {/* could show a toast */}}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
