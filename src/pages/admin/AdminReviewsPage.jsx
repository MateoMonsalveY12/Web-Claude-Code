import { useEffect, useState, useMemo } from 'react'
import { useAdminAuth } from '../../hooks/useAdminAuth.js'
import AdminLayout from '../../components/admin/AdminLayout.jsx'

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          width="12" height="12"
          viewBox="0 0 24 24"
          fill={i <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          className={i <= rating ? 'text-yellow-400' : 'text-slate-600'}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminReviewsPage() {
  const { authenticated, loading: authLoading } = useAdminAuth()
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all') // 'all' | 'visible' | 'hidden'
  const [toggling, setToggling] = useState(null)  // id of review being toggled

  useEffect(() => { document.title = 'Reseñas — Bialy Admin' }, [])

  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    fetch('/api/admin?action=reviews', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setReviews(d.reviews ?? []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [authenticated])

  const kpis = useMemo(() => ({
    total:   reviews.length,
    visible: reviews.filter(r => r.visible).length,
    hidden:  reviews.filter(r => !r.visible).length,
    avg:     reviews.length
      ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
      : '—',
  }), [reviews])

  const filtered = useMemo(() => {
    let list = reviews
    if (filter === 'visible') list = list.filter(r => r.visible)
    if (filter === 'hidden')  list = list.filter(r => !r.visible)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.customer_name?.toLowerCase().includes(q) ||
        r.product_name?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      )
    }
    return list
  }, [reviews, search, filter])

  async function toggleVisible(review) {
    setToggling(review.id)
    try {
      const res = await fetch(`/api/admin?action=reviews&id=${review.id}`, {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ visible: !review.visible }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar')
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, visible: !r.visible } : r))
    } catch (err) {
      alert(err.message)
    } finally {
      setToggling(null)
    }
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
          <h1 className="font-sans text-xl font-bold text-white">Reseñas</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5">Gestiona las reseñas que aparecen en la tienda</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total reseñas',   value: kpis.total,   color: 'text-white' },
            { label: 'Visibles',        value: kpis.visible, color: 'text-green-400' },
            { label: 'Ocultas',         value: kpis.hidden,  color: 'text-slate-400' },
            { label: 'Calificación avg', value: kpis.avg,   color: 'text-yellow-400',
              sub: kpis.avg !== '—' ? 'sobre 5 estrellas' : undefined },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <p className="font-sans text-xs text-slate-500 uppercase tracking-widest mb-3">{label}</p>
              <p className={`font-sans text-2xl font-bold ${color}`}>{value}</p>
              {sub && <p className="font-sans text-xs text-slate-500 mt-1">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por cliente, producto o comentario…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm pl-9 pr-3 py-2 rounded outline-none focus:border-slate-500 placeholder-slate-600"
            />
          </div>
          <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded p-1">
            {[
              { val: 'all',     label: 'Todas' },
              { val: 'visible', label: 'Visibles' },
              { val: 'hidden',  label: 'Ocultas' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`font-sans text-xs px-3 py-1 rounded transition-colors ${
                  filter === val
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="font-sans text-xs text-slate-500">{filtered.length} reseñas</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-400 font-sans text-sm px-4 py-3 rounded">{error}</div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Cliente', 'Producto', 'Calificación', 'Comentario', 'Fecha', 'Estado', 'Acción'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(review => (
                    <tr key={review.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      {/* Cliente */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="font-sans text-xs font-semibold text-slate-300 uppercase">
                              {(review.customer_name ?? '?')[0]}
                            </span>
                          </div>
                          <p className="font-sans text-sm text-white truncate max-w-[120px]">
                            {review.customer_name || '—'}
                          </p>
                        </div>
                      </td>
                      {/* Producto */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="font-sans text-xs text-slate-300 truncate">{review.product_name || '—'}</p>
                        {review.product_slug && (
                          <p className="font-sans text-xs text-slate-600 truncate font-mono">{review.product_slug}</p>
                        )}
                      </td>
                      {/* Calificación */}
                      <td className="px-4 py-3">
                        <StarRating rating={review.rating ?? 0} />
                        <p className="font-sans text-xs text-slate-500 mt-0.5">{review.rating}/5</p>
                      </td>
                      {/* Comentario */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-sans text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {review.comment || <span className="text-slate-600 italic">Sin comentario</span>}
                        </p>
                        {review.photo_url && (
                          <a
                            href={review.photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-xs text-blue-400 underline mt-1 inline-block"
                          >
                            Ver foto
                          </a>
                        )}
                      </td>
                      {/* Fecha */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-sans text-xs text-slate-400">{formatDate(review.created_at)}</p>
                      </td>
                      {/* Estado */}
                      <td className="px-4 py-3">
                        {review.visible
                          ? <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-green-900/40 text-green-300 border-green-700">Visible</span>
                          : <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-slate-800 text-slate-400 border-slate-600">Oculta</span>
                        }
                      </td>
                      {/* Acción */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleVisible(review)}
                          disabled={toggling === review.id}
                          className={`font-sans text-xs font-semibold px-3 py-1.5 rounded whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            review.visible
                              ? 'bg-slate-700 text-white hover:bg-slate-600'
                              : 'bg-green-900/50 text-green-300 border border-green-700 hover:bg-green-900'
                          }`}
                        >
                          {toggling === review.id
                            ? '…'
                            : review.visible ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center font-sans text-sm text-slate-600">
                        No se encontraron reseñas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
