/**
 * Shared filter components for CollectionPage and TallasGrandesPage.
 * Exports: FiltersPanel, FilterSection, PriceRangeSlider, GridButton,
 *          ALL_SIZES, ALL_COLORS, PRICE_MIN, PRICE_MAX
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'

export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const ALL_COLORS = [
  { label: 'Celeste',     value: '#AED6F1' },
  { label: 'Azul marino', value: '#1F3A5F' },
  { label: 'Azul',        value: '#2471A3' },
  { label: 'Marino',      value: '#1A252F' },
  { label: 'Café',        value: '#6E2C00' },
  { label: 'Dorado',      value: '#D4AC0D' },
  { label: 'Crema',       value: '#FDEBD0' },
  { label: 'Gris',        value: '#717D7E' },
  { label: 'Marfil',      value: '#F0EAD6' },
  { label: 'Negro',       value: '#000000' },
]

export const FABRIC_FALLBACK = ['Algodón', 'Lino', 'Seda', 'Poliéster', 'Denim', 'Viscosa', 'Encaje']

export const PRICE_MIN = 0
export const PRICE_MAX = 500000

export const CATEGORY_LINKS = [
  { label: 'Vestidos',           href: '/collections/vestidos' },
  { label: 'Blusas',             href: '/collections/blusas' },
  { label: 'Jeans',              href: '/collections/jeans' },
  { label: 'Tallas Grandes',     href: '/collections/tallas-grandes' },
  { label: 'Nueva Colección',    href: '/collections/nueva-coleccion' },
  { label: 'Básicos Esenciales', href: '/collections/basicos-esenciales' },
  { label: 'Temporada Cálida',   href: '/collections/temporada-calida' },
  { label: 'Accesorios',         href: '/collections/accesorios' },
  { label: 'Rebajas',            href: '/collections/rebajas' },
]

/* ── Grid toggle button ──────────────────────────────────────── */
export function GridButton({ active, onClick, children }) {
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
export function FilterSection({ title, open, onToggle, children, maxH = '400px' }) {
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
export function PriceRangeSlider({ minVal, maxVal, onMinChange, onMaxChange }) {
  const minPercent = Math.round(((minVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100)
  const maxPercent = Math.round(((maxVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100)

  return (
    <div>
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
export function FiltersPanel({
  openSection, setOpenSection,
  selectedSizes, toggleSize,
  selectedColors, setSelectedColors,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  selectedTelas, toggleTela,
  hasFilters, clearFilters,
  category,
}) {
  const [availableTelas, setAvailableTelas] = useState(FABRIC_FALLBACK)

  // Fetch unique non-null fabric values from Supabase
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('products')
      .select('fabric')
      .not('fabric', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const unique = [...new Set(data.map(r => r.fabric).filter(Boolean))].sort()
        if (unique.length > 0) setAvailableTelas(unique)
      })
  }, [])

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

      {/* Price range */}
      <FilterSection title="Precio" open={openSection.price} onToggle={() => toggle('price')} maxH="160px">
        <PriceRangeSlider
          minVal={minPrice}
          maxVal={maxPrice}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
        />
      </FilterSection>

      {/* Fabric — dynamic from DB */}
      <FilterSection title="Tela" open={openSection.tela} onToggle={() => toggle('tela')} maxH="500px">
        <ul>
          {availableTelas.map(t => (
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
