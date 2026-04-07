import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const STATUS_LABEL = {
  APPROVED: { text: 'Aprobado',   color: 'text-green-700 bg-green-50 border-green-200' },
  PENDING:  { text: 'Pendiente',  color: 'text-amber-700 bg-amber-50 border-amber-200' },
  DECLINED: { text: 'Rechazado',  color: 'text-red-700 bg-red-50 border-red-200' },
  VOIDED:   { text: 'Anulado',    color: 'text-red-700 bg-red-50 border-red-200' },
  ERROR:    { text: 'Error',      color: 'text-red-700 bg-red-50 border-red-200' },
}

function fmt(n) {
  return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO')
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function AccountOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    document.title = 'Mis pedidos | Bialy'
  }, [])

  // Redirect to home if not logged in once auth resolves
  useEffect(() => {
    if (!authLoading && !user) navigate('/', { replace: true })
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user || !supabase) return

    setLoading(true)
    // Fetch orders by email (covers orders before and after registration)
    supabase
      .from('orders')
      .select('id, wompi_reference, status, total_amount, created_at, shipping_option, shipping_address, customer_name')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[AccountOrders] fetch error:', error.message)
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
              const badge = STATUS_LABEL[order.status] ?? { text: order.status, color: 'text-brand-black/50 bg-brand-gray border-brand-border' }
              const addr  = order.shipping_address ?? {}
              return (
                <div key={order.id} className="border border-brand-border p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-sans text-xs text-brand-black/40 uppercase tracking-button mb-0.5">
                        Pedido #{order.wompi_reference?.split('-').slice(-1)[0] ?? order.id.slice(0,8).toUpperCase()}
                      </p>
                      <p className="font-sans text-sm font-semibold">{fmt(order.total_amount)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-sans text-xs font-semibold px-2 py-1 border ${badge.color}`}>
                        {badge.text}
                      </span>
                      <span className="font-sans text-xs text-brand-black/40">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>

                  {order.shipping_option && (
                    <p className="font-sans text-xs text-brand-black/60">
                      Envío: {order.shipping_option}
                    </p>
                  )}

                  {(addr.city || addr.address) && (
                    <p className="font-sans text-xs text-brand-black/50">
                      {[addr.address, addr.apt, addr.city, addr.state].filter(Boolean).join(', ')}
                    </p>
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
