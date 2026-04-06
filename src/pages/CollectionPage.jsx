import { useState, useEffect, useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard.jsx'
import Breadcrumb from '../components/shared/Breadcrumb.jsx'

const CATEGORY_META = {
  'vestidos':          { title: 'Vestidos',        banner: '/assets/images/banner-vestidos.jpg' },
  'blusas':            { title: 'Blusas',           banner: '/assets/images/banner-blusas.jpg' },
  'jeans':             { title: 'Jeans & Pantalones', banner: '/assets/images/banner-jeans.jpg' },
  'tallas-grandes':    { title: 'Tallas Grandes',   banner: '/assets/images/banner-tallas-grandes.jpg' },
  'nueva-coleccion':   { title: 'Nueva Colección',  banner: '/assets/images/banner-nueva-coleccion.jpg' },
}

const PRICE_RANGES = [
  { label: 'Menos de $150.000',           min: 0,      max: 150000 },
  { label: '$150.000 – $250.000',         min: 150000, max: 250000 },
  { label: '$250.000 – $350.000',         min: 250000, max: 350000 },
  { label: 'Más de $350.000',             min: 350000, max: null },
]

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']
const ALL_COLORS = [
  { label: 'Negro',   value: '#000000' },
  { label: 'Blanco',  value: '#FFFFFF' },
  { label: 'Azul',    value: '#1B3A6B' },
  { label: 'Rosa',    value: '#F4A7B9' },
  { label: 'Beige',   value: '#D4B896' },
  { label: 'Verde',   value: '#6B7C45' },
]

export default function CollectionPage({ category: propCategory }) {
  const { category: paramCategory } = useParams()
  const category = propCategory || paramCategory

  const meta = CATEGORY_META[category] || { title: category, banner: '/assets/images/banner-nueva-coleccion.jpg' }

  // Filters state
  const [selectedSizes,  setSelectedSizes]  = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [priceRange,     setPriceRange]     = useState(null)
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [openSection,    setOpenSection]    = useState({ sizes: true, price: true, color: true })

  const filters = useMemo(() => ({
    category: category === 'nueva-coleccion' ? undefined : category,
    sizes: selectedSizes.length ? selectedSizes : undefined,
    minPrice: priceRange?.min || undefined,
    maxPrice: priceRange?.max || undefined,
  }), [category, selectedSizes, priceRange])

  const { products, loading } = useProducts(filters)

  function toggleSize(s) {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function clearFilters() {
    setSelectedSizes([])
    setSelectedColors([])
    setPriceRange(null)
  }

  const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || priceRange

  return (
    <>
      {/* Collection banner */}
      <div className="relative w-full overflow-hidden" style={{ height: 'clamp(220px, 30vw, 360px)' }}>
        <img
          src={meta.banner}
          alt={meta.title}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
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

      {/* Main layout */}
      <div className="container-brand pb-16">
        {/* Toolbar */}
        <div className="flex items-center justify-between py-4 border-b border-brand-border mb-8">
          <span className="font-sans text-sm text-brand-black/50">
            {loading ? '…' : `${products.length} productos`}
          </span>
          <button
            className="md:hidden font-sans text-xs uppercase tracking-button font-semibold flex items-center gap-2"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
            Filtros {hasFilters && `(${selectedSizes.length + (priceRange ? 1 : 0)})`}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="hidden md:block font-sans text-xs uppercase tracking-button text-brand-black/40 hover:text-brand-black transition-colors">
              Limpiar filtros ✕
            </button>
          )}
        </div>

        <div className="flex gap-8">
          {/* ── Sidebar filters (desktop) ──────────────────────── */}
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

          {/* ── Product grid ───────────────────────────────────── */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-sans text-sm text-brand-black/40 mb-4">No hay productos con estos filtros.</p>
                <button onClick={clearFilters} className="btn-ghost btn-sm">Limpiar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} aosDelay={i * 40} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────── */}
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

function FilterSection({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-brand-border py-4">
      <button
        className="flex items-center justify-between w-full font-sans text-xs font-semibold uppercase tracking-button text-brand-black mb-0"
        onClick={onToggle}
        aria-expanded={open}
      >
        {title}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div
        style={{
          maxHeight: open ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 300ms ease-out',
        }}
      >
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}

function FiltersPanel({ openSection, setOpenSection, selectedSizes, toggleSize, selectedColors, setSelectedColors, priceRange, setPriceRange, hasFilters, clearFilters }) {
  function toggle(key) { setOpenSection(s => ({ ...s, [key]: !s[key] })) }
  function toggleColor(v) { setSelectedColors(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]) }

  return (
    <div>
      {hasFilters && (
        <button onClick={clearFilters} className="font-sans text-xs uppercase tracking-button text-brand-black/40 hover:text-brand-black transition-colors mb-3">
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
              className={`font-sans text-xs px-3 py-1.5 border transition-colors duration-150 ${selectedSizes.includes(s) ? 'bg-brand-black text-white border-brand-black' : 'border-brand-border text-brand-black hover:border-brand-black'}`}
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
        <div className="flex flex-wrap gap-2">
          {ALL_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => toggleColor(c.value)}
              title={c.label}
              className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ${selectedColors.includes(c.value) ? 'border-brand-black scale-110' : 'border-brand-border'}`}
              style={{ background: c.value }}
              aria-label={c.label}
              aria-pressed={selectedColors.includes(c.value)}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  )
}
