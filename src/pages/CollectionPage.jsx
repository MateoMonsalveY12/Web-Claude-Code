import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard.jsx'
import Breadcrumb from '../components/shared/Breadcrumb.jsx'

const CATEGORY_META = {
  'vestidos':        { title: 'Vestidos',           banner: '/images/banner-vestidos.jpg' },
  'blusas':          { title: 'Blusas',             banner: '/images/banner-blusas.jpg' },
  'jeans':           { title: 'Jeans & Pantalones', banner: '/images/banner-jeans.jpg' },
  'tallas-grandes':  { title: 'Tallas Grandes',     banner: '/images/banner-tallas-grandes.jpg' },
  'nueva-coleccion': { title: 'Nueva Colección',    banner: '/images/banner-nueva-coleccion.jpg' },
}

const CATEGORY_LINKS = [
  { label: 'Ropa',                 href: '/collections/vestidos' },
  { label: 'Básicas',              href: '/collections/blusas' },
  { label: 'Tallas Grandes',       href: '/collections/tallas-grandes' },
  { label: 'Rebajas',              href: '/collections/nueva-coleccion' },
  { label: 'Accesorios y Zapatos', href: '/collections/accesorios' },
  { label: 'Uniformes',            href: '/collections/uniformes' },
  { label: 'Bono Regalo',          href: '/collections/bono-regalo' },
]

const ALL_SIZES = ['6', '8', '10', '12', '14', '16', '18', '20']

const ALL_COLORS = [
  { label: 'Celeste',      value: '#AED6F1' },
  { label: 'Azul marino',  value: '#1F3A5F' },
  { label: 'Azul',         value: '#2471A3' },
  { label: 'Marino',       value: '#1A252F' },
  { label: 'Café',         value: '#6E2C00' },
  { label: 'Dorado',       value: '#D4AC0D' },
  { label: 'Crema',        value: '#FDEBD0' },
  { label: 'Gris',         value: '#717D7E' },
  { label: 'Marfil',       value: '#F0EAD6' },
  { label: 'Negro',        value: '#000000' },
]

const ALL_TELAS = ['Algodón', 'Elastano', 'Índigo', 'Licra', 'Poliéster', 'Tencel', 'Viscosa']

const PRICE_MIN = 0
const PRICE_MAX = 500000

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

  const filters = useMemo(() => ({
    category: category === 'nueva-coleccion' ? undefined : category,
    sizes:    selectedSizes.length  ? selectedSizes  : undefined,
    colors:   selectedColors.length ? selectedColors : undefined,
    minPrice: minPrice > PRICE_MIN  ? minPrice       : undefined,
    maxPrice: maxPrice < PRICE_MAX  ? maxPrice       : undefined,
  }), [category, selectedSizes, selectedColors, minPrice, maxPrice])

  const { products, loading } = useProducts(filters)

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
            className="hidden md:block w-60 shrink-0 self-start"
            style={{ position: 'sticky', top: 'calc(var(--nav-h) + 1.5rem)' }}
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
                {products.map((p, i) => (
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

/* ── Grid toggle button ──────────────────────────────────────── */
function GridButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-25 hover:opacity-60'}`}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

/* ── Filter section accordion ────────────────────────────────── */
function FilterSection({ title, open, onToggle, children, maxH = '400px' }) {
  return (
    <div className="border-b border-brand-border py-5">
      <button
        className="flex items-center justify-between w-full font-sans text-xs font-semibold uppercase tracking-button text-brand-black"
        onClick={onToggle}
        aria-expanded={open}
      >
        {title}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div style={{ maxHeight: open ? maxH : '0', overflow: 'hidden', transition: 'max-height 300ms ease-out' }}>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}

/* ── Dual range price slider ─────────────────────────────────── */
function PriceRangeSlider({ minVal, maxVal, onMinChange, onMaxChange }) {
  const minPercent = Math.round(((minVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100)
  const maxPercent = Math.round(((maxVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100)

  return (
    <div>
      {/* Track */}
      <div className="relative h-px bg-brand-border rounded-full mb-5 mx-1.5" style={{ marginTop: '10px' }}>
        <div
          className="absolute h-px bg-brand-black"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={PRICE_MIN} max={PRICE_MAX} value={minVal} step={5000}
          onChange={e => onMinChange(Math.min(Number(e.target.value), maxVal - 10000))}
          className="filter-range-input"
        />
        <input
          type="range"
          min={PRICE_MIN} max={PRICE_MAX} value={maxVal} step={5000}
          onChange={e => onMaxChange(Math.max(Number(e.target.value), minVal + 10000))}
          className="filter-range-input"
        />
      </div>
      {/* Number inputs */}
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 border border-brand-border flex items-center px-2.5 py-1.5 gap-1 min-w-0">
          <span className="font-sans text-xs text-brand-black/50">$</span>
          <input
            type="number"
            min={PRICE_MIN} max={maxVal - 10000} value={minVal} step={5000}
            onChange={e => onMinChange(Math.max(PRICE_MIN, Math.min(Number(e.target.value), maxVal - 10000)))}
            className="w-full font-sans text-xs text-brand-black bg-transparent outline-none min-w-0"
          />
        </div>
        <span className="font-sans text-xs text-brand-black/50 shrink-0">a</span>
        <div className="flex-1 border border-brand-border flex items-center px-2.5 py-1.5 gap-1 min-w-0">
          <span className="font-sans text-xs text-brand-black/50">$</span>
          <input
            type="number"
            min={minVal + 10000} max={PRICE_MAX} value={maxVal} step={5000}
            onChange={e => onMaxChange(Math.min(PRICE_MAX, Math.max(Number(e.target.value), minVal + 10000)))}
            className="w-full font-sans text-xs text-brand-black bg-transparent outline-none min-w-0"
          />
        </div>
      </div>
    </div>
  )
}

/* ── Filters panel ───────────────────────────────────────────── */
function FiltersPanel({
  openSection, setOpenSection,
  selectedSizes, toggleSize,
  selectedColors, setSelectedColors,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  selectedTelas, toggleTela,
  hasFilters, clearFilters,
  category,
}) {
  function toggle(key) { setOpenSection(s => ({ ...s, [key]: !s[key] })) }
  function toggleColor(v) {
    setSelectedColors(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  return (
    <div>
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="font-sans text-xs uppercase tracking-button text-brand-black/40 hover:text-brand-black transition-colors mb-3"
        >
          Limpiar filtros ✕
        </button>
      )}

      {/* Category navigation */}
      <FilterSection title="Ropa para mujer" open={openSection.category} onToggle={() => toggle('category')} maxH="500px">
        <ul>
          {CATEGORY_LINKS.map(l => (
            <li key={l.href}>
              <Link
                to={l.href}
                className={`block font-sans text-sm py-1.5 transition-colors duration-150 ${
                  l.href.includes(category)
                    ? 'text-brand-black font-medium'
                    : 'text-brand-black/60 hover:text-brand-black'
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Sizes */}
      <FilterSection title="Talla" open={openSection.sizes} onToggle={() => toggle('sizes')}>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map(s => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`font-sans text-sm w-10 h-10 border transition-colors duration-150 ${
                selectedSizes.includes(s)
                  ? 'bg-brand-black text-white border-brand-black'
                  : 'border-brand-border text-brand-black hover:border-brand-black'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Colors */}
      <FilterSection title="Color" open={openSection.color} onToggle={() => toggle('color')}>
        <div className="flex flex-wrap gap-3">
          {ALL_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => toggleColor(c.value)}
              title={c.label}
              aria-label={c.label}
              aria-pressed={selectedColors.includes(c.value)}
              className={`w-9 h-9 rounded-full transition-all duration-150 ${
                selectedColors.includes(c.value)
                  ? 'ring-2 ring-offset-2 ring-brand-black'
                  : 'ring-1 ring-black/10 hover:ring-brand-black/40'
              }`}
              style={{ background: c.value }}
            />
          ))}
        </div>
      </FilterSection>

      {/* Price range slider */}
      <FilterSection title="Precio" open={openSection.price} onToggle={() => toggle('price')} maxH="160px">
        <PriceRangeSlider
          minVal={minPrice}
          maxVal={maxPrice}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
        />
      </FilterSection>

      {/* Fabric */}
      <FilterSection title="Tela" open={openSection.tela} onToggle={() => toggle('tela')} maxH="500px">
        <ul>
          {ALL_TELAS.map(t => (
            <li key={t}>
              <button
                onClick={() => toggleTela(t)}
                className={`block w-full text-left font-sans text-sm py-1.5 transition-colors duration-150 ${
                  selectedTelas.includes(t)
                    ? 'text-brand-black font-medium'
                    : 'text-brand-black/60 hover:text-brand-black'
                }`}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>
    </div>
  )
}
