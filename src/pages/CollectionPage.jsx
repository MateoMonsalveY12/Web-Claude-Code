import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
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

const PRICE_RANGES = [
  { label: 'Menos de $150.000',   min: 0,      max: 150000 },
  { label: '$150.000 – $250.000', min: 150000, max: 250000 },
  { label: '$250.000 – $350.000', min: 250000, max: 350000 },
  { label: 'Más de $350.000',     min: 350000, max: null },
]

const ALL_SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']
const ALL_COLORS = [
  { label: 'Negro',  value: '#000000' },
  { label: 'Blanco', value: '#FFFFFF' },
  { label: 'Azul',   value: '#1B3A6B' },
  { label: 'Rosa',   value: '#F4A7B9' },
  { label: 'Beige',  value: '#D4B896' },
  { label: 'Verde',  value: '#6B7C45' },
]

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
  const [priceRange,     setPriceRange]     = useState(null)
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [openSection,    setOpenSection]    = useState({ sizes: true, price: true, color: true })

  // Grid view: '3' | '4' | '6'
  const [gridView, setGridView] = useState('3')

  const filters = useMemo(() => ({
    category: category === 'nueva-coleccion' ? undefined : category,
    sizes:    selectedSizes.length  ? selectedSizes  : undefined,
    colors:   selectedColors.length ? selectedColors : undefined,
    minPrice: priceRange?.min || undefined,
    maxPrice: priceRange?.max || undefined,
  }), [category, selectedSizes, selectedColors, priceRange])

  const { products, loading } = useProducts(filters)

  function toggleSize(s) {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function clearFilters() {
    setSelectedSizes([])
    setSelectedColors([])
    setPriceRange(null)
  }

  const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || !!priceRange

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

      <div className="container-brand">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Tienda', href: '/collections' },
          { label: meta.title },
        ]} />
      </div>

      <div className="container-brand pb-16">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between py-4 border-b border-brand-border mb-8 gap-4">
          {/* Left: grid toggles + filter button (mobile) */}
          <div className="flex items-center gap-3">
            {/* Grid view toggle — desktop only */}
            <div className="hidden md:flex items-center gap-1">
              <GridButton view="3" active={gridView === '3'} onClick={() => setGridView('3')}>
                <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
                  <rect x="0"  y="0" width="4" height="15"/>
                  <rect x="5.5" y="0" width="4" height="15"/>
                  <rect x="11" y="0" width="4" height="15"/>
                </svg>
              </GridButton>
              <GridButton view="4" active={gridView === '4'} onClick={() => setGridView('4')}>
                <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
                  <rect x="0"   y="0" width="3" height="15"/>
                  <rect x="4"   y="0" width="3" height="15"/>
                  <rect x="8"   y="0" width="3" height="15"/>
                  <rect x="12"  y="0" width="3" height="15"/>
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
              Filtros {hasFilters && `(${selectedSizes.length + selectedColors.length + (priceRange ? 1 : 0)})`}
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
            <div className="w-28" /> /* spacer to keep count centered */
          )}
        </div>

        <div className="flex gap-8">
          {/* ── Sidebar filters (desktop) ── */}
          <aside className="hidden md:block w-56 shrink-0">
            <FiltersPanel
              openSection={openSection}
              setOpenSection={setOpenSection}
              selectedSizes={selectedSizes}
              toggleSize={toggleSize}
              selectedColors={selectedColors}
              setSelectedColors={setSelectedColors}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              hasFilters={hasFilters}
              clearFilters={clearFilters}
            />
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
              <FiltersPanel
                openSection={openSection}
                setOpenSection={setOpenSection}
                selectedSizes={selectedSizes}
                toggleSize={toggleSize}
                selectedColors={selectedColors}
                setSelectedColors={setSelectedColors}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                hasFilters={hasFilters}
                clearFilters={clearFilters}
              />
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
function FilterSection({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-brand-border py-4">
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
      <div style={{ maxHeight: open ? '400px' : '0', overflow: 'hidden', transition: 'max-height 300ms ease-out' }}>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}

/* ── Filters panel ───────────────────────────────────────────── */
function FiltersPanel({
  openSection, setOpenSection,
  selectedSizes, toggleSize,
  selectedColors, setSelectedColors,
  priceRange, setPriceRange,
  hasFilters, clearFilters,
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

      {/* Sizes */}
      <FilterSection title="Talla" open={openSection.sizes} onToggle={() => toggle('sizes')}>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map(s => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`font-sans text-xs px-3 py-1.5 border transition-colors duration-150 ${
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

      {/* Price */}
      <FilterSection title="Precio" open={openSection.price} onToggle={() => toggle('price')}>
        <ul className="space-y-2">
          {PRICE_RANGES.map(r => (
            <li key={r.label}>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={priceRange?.label === r.label}
                  onChange={() => setPriceRange(priceRange?.label === r.label ? null : r)}
                  className="accent-brand-black"
                />
                <span className="font-sans text-sm text-brand-black/70">{r.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Colors */}
      <FilterSection title="Color" open={openSection.color} onToggle={() => toggle('color')}>
        <div className="flex flex-wrap gap-2.5">
          {ALL_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => toggleColor(c.value)}
              title={c.label}
              aria-label={c.label}
              aria-pressed={selectedColors.includes(c.value)}
              className={`relative w-7 h-7 rounded-full transition-all duration-150 ${
                selectedColors.includes(c.value)
                  ? 'ring-2 ring-offset-1 ring-brand-black scale-110'
                  : 'ring-1 ring-brand-border hover:ring-brand-black/40'
              }`}
              style={{ background: c.value }}
            >
              {selectedColors.includes(c.value) && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke={c.value === '#FFFFFF' ? '#000' : '#fff'}
                    strokeWidth="3" strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  )
}
