import { useEffect, useState, useMemo } from 'react'
import { useAdminAuth } from '../../hooks/useAdminAuth.js'
import AdminLayout from '../../components/admin/AdminLayout.jsx'

const CATEGORY_LABELS = {
  vestidos:           'Vestidos',
  blusas:             'Blusas',
  jeans:              'Jeans',
  accesorios:         'Accesorios',
  'nueva-coleccion':  'Nueva colección',
  'tallas-grandes':   'Tallas grandes',
  rebajas:            'Rebajas',
}

function fmt(n) { return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO') }

function StockBadge({ stock }) {
  if (stock === null || stock === undefined) return <span className="font-sans text-xs text-slate-500">—</span>
  if (stock === 0)
    return <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-red-900/40 text-red-300 border-red-700">Agotado</span>
  if (stock <= 5)
    return <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-yellow-900/40 text-yellow-300 border-yellow-700">{stock} uds</span>
  return <span className="font-sans text-sm text-white">{stock}</span>
}

function StatusBadge({ active }) {
  return active
    ? <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-green-900/40 text-green-300 border-green-700">Activo</span>
    : <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-slate-800 text-slate-400 border-slate-600">Inactivo</span>
}

export default function AdminProductsPage() {
  const { authenticated, loading: authLoading } = useAdminAuth()
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => { document.title = 'Productos — Bialy Admin' }, [])

  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    fetch('/api/admin/products', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [authenticated])

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean))
    return [...set].sort()
  }, [products])

  const filtered = useMemo(() => {
    let list = products
    if (catFilter) list = list.filter(p => p.category === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, search, catFilter])

  const kpis = useMemo(() => ({
    total:    products.length,
    active:   products.filter(p => p.is_available !== false).length,
    soldOut:  products.filter(p => (p.stock ?? 0) === 0).length,
    featured: products.filter(p => p.is_featured).length,
  }), [products])

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
          <h1 className="font-sans text-xl font-bold text-white">Productos</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5">Catálogo completo de la tienda (solo lectura)</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total productos', value: kpis.total, color: 'text-white' },
            { label: 'Activos',         value: kpis.active,   color: 'text-green-400' },
            { label: 'Agotados',        value: kpis.soldOut,  color: 'text-red-400' },
            { label: 'Destacados',      value: kpis.featured, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <p className="font-sans text-xs text-slate-500 uppercase tracking-widest mb-3">{label}</p>
              <p className={`font-sans text-2xl font-bold ${color}`}>{value}</p>
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
              placeholder="Buscar por nombre o slug…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm pl-9 pr-3 py-2 rounded outline-none focus:border-slate-500 placeholder-slate-600"
            />
          </div>
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
            ))}
          </select>
          <span className="font-sans text-xs text-slate-500">{filtered.length} productos</span>
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
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Imagen', 'Producto', 'Categoría', 'Precio', 'Stock', 'Vendidos', 'Estado'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(product => {
                    const thumb = Array.isArray(product.images) ? product.images[0] : product.images
                    return (
                      <tr key={product.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        {/* Imagen */}
                        <td className="px-4 py-3">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.name}
                              className="w-10 h-12 object-cover rounded bg-slate-700"
                              onError={e => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            <div className="w-10 h-12 bg-slate-700 rounded flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
                                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                              </svg>
                            </div>
                          )}
                        </td>
                        {/* Producto */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="font-sans text-sm text-white truncate">{product.name}</p>
                          <p className="font-sans text-xs text-slate-500 truncate font-mono">{product.slug}</p>
                        </td>
                        {/* Categoría */}
                        <td className="px-4 py-3">
                          <p className="font-sans text-xs text-slate-400">
                            {CATEGORY_LABELS[product.category] ?? product.category ?? '—'}
                          </p>
                        </td>
                        {/* Precio */}
                        <td className="px-4 py-3">
                          <p className="font-sans text-sm font-semibold text-white whitespace-nowrap">{fmt(product.price)}</p>
                          {product.compare_price > product.price && (
                            <p className="font-sans text-xs text-slate-500 line-through">{fmt(product.compare_price)}</p>
                          )}
                        </td>
                        {/* Stock */}
                        <td className="px-4 py-3">
                          <StockBadge stock={product.stock} />
                        </td>
                        {/* Vendidos */}
                        <td className="px-4 py-3">
                          <p className="font-sans text-sm text-slate-400">{product.total_sold ?? 0}</p>
                        </td>
                        {/* Estado */}
                        <td className="px-4 py-3">
                          <StatusBadge active={product.is_available !== false} />
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center font-sans text-sm text-slate-600">
                        No se encontraron productos.
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
