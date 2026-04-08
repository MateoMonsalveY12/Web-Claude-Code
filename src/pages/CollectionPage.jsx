import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard.jsx'
import Breadcrumb from '../components/shared/Breadcrumb.jsx'
import {
  FiltersPanel, GridButton,
  PRICE_MIN, PRICE_MAX,
} from '../components/filters/CollectionFilters.jsx'

const CATEGORY_META = {
  'vestidos':            { title: 'Vestidos',            banner: '/images/banner-vestidos.jpg' },
  'blusas':              { title: 'Blusas',              banner: '/images/banner-blusas.jpg' },
  'jeans':               { title: 'Jeans',               banner: '/images/banner-jeans.jpg' },
  'tallas-grandes':      { title: 'Tallas Grandes',      banner: '/images/banner-tallas-grandes.jpg' },
  'nueva-coleccion':     { title: 'Nueva Colección',     banner: '/images/banner-nueva-coleccion.jpg' },
  'rebajas':             { title: 'Rebajas',             banner: '/images/banner-nueva-coleccion.jpg' },
  'accesorios':          { title: 'Accesorios',          banner: '/images/banner-nueva-coleccion.jpg' },
  'basicos-esenciales':  { title: 'Básicos Esenciales',  banner: '/images/banner-blusas.jpg' },
  'temporada-calida':    { title: 'Temporada Cálida',    banner: '/images/banner-vestidos.jpg' },
}

// Grid configurations: cols on mobile / cols on desktop / gap
const GRID_CONFIGS = {
  '3': { mobile: 2, desktop: 3, gap: 'gap-4 md:gap-5' },
  '4': { mobile: 2, desktop: 4, gap: 'gap-3 md:gap-4' },
  '6': { mobile: 2, desktop: 6, gap: 'gap-2 md:gap-3' },
}

function gridClass(view) {
  const { mobile, desktop, gap } = GRID_CONFIGS[view]
  return `grid grid-cols-${mobile} md:grid-cols-${desktop} ${gap}`
}

export default function CollectionPage({ category: propCategory }) {
  const { category: paramCategory } = useParams()
  const category = propCategory || paramCategory

  const meta = CATEGORY_META[category] || { title: category, banner: '/images/banner-nueva-coleccion.jpg' }

  // Filters
  const [selectedSizes,  setSelectedSizes]  = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [minPrice,       setMinPrice]       = useState(PRICE_MIN)
  const [maxPrice,       setMaxPrice]       = useState(PRICE_MAX)
  const [selectedTelas,  setSelectedTelas]  = useState([])
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [openSection,    setOpenSection]    = useState({
    category: true, sizes: true, color: true, price: true, tela: true,
  })

  // Grid view: '3' | '4' | '6'
  const [gridView, setGridView] = useState('3')

  // Reset filters when category changes
  useEffect(() => {
    setSelectedSizes([])
    setSelectedColors([])
    setMinPrice(PRICE_MIN)
    setMaxPrice(PRICE_MAX)
    setSelectedTelas([])
  }, [category])

  const filters = useMemo(() => ({
    category,
    sizes:    selectedSizes.length  ? selectedSizes  : undefined,
    colors:   selectedColors.length ? selectedColors : undefined,
    minPrice: minPrice > PRICE_MIN  ? minPrice       : undefined,
    maxPrice: maxPrice < PRICE_MAX  ? maxPrice       : undefined,
    fabric:   selectedTelas.length  ? selectedTelas  : undefined,
  }), [category, selectedSizes, selectedColors, minPrice, maxPrice, selectedTelas])

  const { products, loading } = useProducts(filters)

  // SEO title
  useEffect(() => { document.title = `${meta.title} | Bialy` }, [meta.title])

  function toggleSize(s) {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  function toggleTela(t) {
    setSelectedTelas(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function clearFilters() {
    setSelectedSizes([])
    setSelectedColors([])
    setMinPrice(PRICE_MIN)
    setMaxPrice(PRICE_MAX)
    setSelectedTelas([])
  }

  const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || selectedTelas.length > 0
    || minPrice > PRICE_MIN || maxPrice < PRICE_MAX
  const filterCount = selectedSizes.length + selectedColors.length + selectedTelas.length
    + (minPrice > PRICE_MIN || maxPrice < PRICE_MAX ? 1 : 0)

  const panelProps = {
    openSection, setOpenSection,
    selectedSizes, toggleSize,
    selectedColors, setSelectedColors,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    selectedTelas, toggleTela,
    hasFilters, clearFilters,
    category,
  }

  return (
    <>
      {/* Collection banner */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          marginTop: 'calc(-1 * var(--header-h))',
          height: 'calc(clamp(220px, 30vw, 360px) + var(--header-h))',
        }}
      >
        <img src={meta.banner} alt={meta.title} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ paddingTop: 'var(--header-h)' }}
        >
          <h1
            className="font-display text-white tracking-heading"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.05 }}
          >
            {meta.title}
          </h1>
        </div>
      </div>

      <div className="px-4 sm:px-5 md:px-8 xl:px-12">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Tienda', href: '/collections' },
          { label: meta.title },
        ]} />
      </div>

      <div className="w-full px-4 sm:px-5 md:px-8 xl:px-12 pb-16 max-w-[1800px] mx-auto">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between py-4 border-b border-brand-border mb-8 gap-4">
          {/* Left: grid toggles + filter button (mobile) */}
          <div className="flex items-center gap-3">
            {/* Grid view toggle — desktop only */}
            <div className="hidden md:flex items-center gap-1">
              <GridButton view="3" active={gridView === '3'} onClick={() => setGridView('3')}>
                <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
                  <rect x="0"   y="0" width="4"   height="15"/>
                  <rect x="5.5" y="0" width="4"   height="15"/>
                  <rect x="11"  y="0" width="4"   height="15"/>
                </svg>
              </GridButton>
              <GridButton view="4" active={gridView === '4'} onClick={() => setGridView('4')}>
                <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
                  <rect x="0"  y="0" width="3" height="15"/>
                  <rect x="4"  y="0" width="3" height="15"/>
                  <rect x="8"  y="0" width="3" height="15"/>
                  <rect x="12" y="0" width="3" height="15"/>
                </svg>
              </GridButton>
              <GridButton view="6" active={gridView === '6'} onClick={() => setGridView('6')}>
                <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
                  <rect x="0"    y="0" width="1.8" height="15"/>
                  <rect x="2.6"  y="0" width="1.8" height="15"/>
                  <rect x="5.2"  y="0" width="1.8" height="15"/>
                  <rect x="7.8"  y="0" width="1.8" height="15"/>
                  <rect x="10.4" y="0" width="1.8" height="15"/>
                  <rect x="13"   y="0" width="1.8" height="15"/>
                </svg>
              </GridButton>
            </div>

            {/* Filters button — mobile */}
            <button
              className="md:hidden font-sans text-xs uppercase tracking-button font-semibold flex items-center gap-2"
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="20" y2="12"/>
                <line x1="12" y1="18" x2="20" y2="18"/>
              </svg>
              Filtros {filterCount > 0 && `(${filterCount})`}
            </button>
          </div>

          {/* Center: product count */}
          <span className="font-sans text-sm text-brand-black/50">
            {loading ? '…' : `${products.length} productos`}
          </span>

          {/* Right: clear filters */}
          {hasFilters ? (
            <button
              onClick={clearFilters}
              className="font-sans text-xs uppercase tracking-button text-brand-black/40 hover:text-brand-black transition-colors"
            >
              Limpiar filtros ✕
            </button>
          ) : (
            <div className="w-28" />
          )}
        </div>

        <div className="flex gap-8">
          {/* ── Sidebar filters (desktop) ── */}
          <aside
            className="hidden md:block w-60 shrink-0"
            style={{
              position: 'sticky',
              top: 'calc(var(--nav-h) + 1rem)',
              maxHeight: 'calc(100vh - var(--nav-h) - 2rem)',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#E0E0E0 transparent',
            }}
          >
            <FiltersPanel {...panelProps} />
          </aside>

          {/* ── Product grid ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={gridClass(gridView)}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-sans text-sm text-brand-black/40 mb-4">No hay productos con estos filtros.</p>
                <button onClick={clearFilters} className="btn-ghost btn-sm">Limpiar filtros</button>
              </div>
            ) : (
              <div className={gridClass(gridView)}>
                {[...products]
                  .sort((a, b) => {
                    const aOut = a.is_available === false
                    const bOut = b.is_available === false
                    if (aOut === bOut) return 0
                    return aOut ? 1 : -1
                  })
                  .map((p, i) => (
                    <ProductCard key={p.id} product={p} aosDelay={i * 40} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative ml-auto w-80 max-w-full bg-brand-white h-full overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <span className="font-sans text-sm font-semibold uppercase tracking-button">Filtros</span>
              <button onClick={() => setSidebarOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 p-5">
              <FiltersPanel {...panelProps} />
            </div>
            <div className="p-5 border-t border-brand-border">
              <button className="btn-primary w-full" onClick={() => setSidebarOpen(false)}>
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
