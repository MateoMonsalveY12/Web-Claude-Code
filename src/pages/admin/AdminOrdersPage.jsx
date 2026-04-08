import { useEffect, useState, useMemo } from 'react'
import { useAdminAuth } from '../../hooks/useAdminAuth.js'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import OrderManageModal from '../../components/admin/OrderManageModal.jsx'

const STATUS_CFG = {
  PAGO_APROBADO: { label: 'Pago aprobado', color: 'bg-blue-900/40 text-blue-300 border-blue-700' },
  EMPACANDO:     { label: 'Empacando',     color: 'bg-yellow-900/40 text-yellow-300 border-yellow-700' },
  EN_CAMINO:     { label: 'En camino',     color: 'bg-orange-900/40 text-orange-300 border-orange-700' },
  ENTREGADO:     { label: 'Entregado',     color: 'bg-green-900/40 text-green-300 border-green-700' },
}

function fmt(n) { return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO') }
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function KPICard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <p className="font-sans text-xs text-slate-500 uppercase tracking-widest mb-3">{label}</p>
      <p className={`font-sans text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="font-sans text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' }
  return (
    <span className={`inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default function AdminOrdersPage() {
  const { authenticated, loading: authLoading } = useAdminAuth()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')
  const [managed, setManaged] = useState(null) // order being managed

  useEffect(() => { document.title = 'Pedidos — Bialy Admin' }, [])

  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    fetch('/api/admin?action=orders', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setOrders(d.orders ?? [])
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [authenticated])

  const kpis = useMemo(() => {
    const approved = orders.filter(o => o.status === 'APPROVED')
    return {
      total:   orders.length,
      revenue: approved.reduce((s, o) => s + (o.total_amount ?? 0), 0),
      pending: approved.filter(o => ['PAGO_APROBADO', 'EMPACANDO'].includes(o.order_status)).length,
      transit: approved.filter(o => o.order_status === 'EN_CAMINO').length,
    }
  }, [orders])

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.toLowerCase()
    return orders.filter(o =>
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q) ||
      o.wompi_reference?.toLowerCase().includes(q) ||
      o.id?.toLowerCase().includes(q)
    )
  }, [orders, search])

  function handleOrderUpdated(updated) {
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
    setManaged(null)
  }

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
    </div>
  )
  if (!authenticated) return null

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page title */}
        <div>
          <h1 className="font-sans text-xl font-bold text-white">Pedidos</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5">
            Todos los pedidos de la tienda
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard label="Total pedidos"   value={kpis.total} />
          <KPICard label="Ingresos totales" value={fmt(kpis.revenue)} color="text-green-400" />
          <KPICard label="Por procesar"    value={kpis.pending} color="text-yellow-400"
                   sub="Pago aprobado + Empacando" />
          <KPICard label="En camino"       value={kpis.transit}  color="text-orange-400" />
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por cliente o referencia…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm pl-9 pr-3 py-2 rounded outline-none focus:border-slate-500 placeholder-slate-600"
            />
          </div>
          <span className="font-sans text-xs text-slate-500">{filtered.length} pedidos</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-400 font-sans text-sm px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Pedido', 'Fecha', 'Cliente', 'Total', 'Productos', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-sans text-xs text-slate-300 font-mono">
                          {order.wompi_reference?.split('-').slice(-1)[0] ?? order.id.slice(0,8).toUpperCase()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-sans text-xs text-slate-400 whitespace-nowrap">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-sans text-sm text-white truncate">{order.customer_name || '—'}</p>
                        <p className="font-sans text-xs text-slate-500 truncate">{order.customer_email || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-sans text-sm font-semibold text-white whitespace-nowrap">{fmt(order.total_amount)}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {order.items?.length > 0 ? (
                          <div className="space-y-0.5">
                            {order.items.slice(0, 2).map((item, i) => (
                              <p key={i} className="font-sans text-xs text-slate-400 truncate">
                                {item.quantity}× {item.product_name}
                              </p>
                            ))}
                            {order.items.length > 2 && (
                              <p className="font-sans text-xs text-slate-600">+{order.items.length - 2} más</p>
                            )}
                          </div>
                        ) : (
                          <p className="font-sans text-xs text-slate-600">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.order_status ?? 'PAGO_APROBADO'} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setManaged(order)}
                          className="font-sans text-xs font-semibold px-3 py-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors whitespace-nowrap"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center font-sans text-sm text-slate-600">
                        No se encontraron pedidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order manage modal */}
      {managed && (
        <OrderManageModal
          order={managed}
          onClose={() => setManaged(null)}
          onUpdated={handleOrderUpdated}
        />
      )}
    </AdminLayout>
  )
}
