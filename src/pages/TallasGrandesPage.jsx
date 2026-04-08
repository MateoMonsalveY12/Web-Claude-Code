import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard.jsx'
import Breadcrumb from '../components/shared/Breadcrumb.jsx'
import {
  FiltersPanel,
  PRICE_MIN, PRICE_MAX,
} from '../components/filters/CollectionFilters.jsx'

export default function TallasGrandesPage() {
  const category = 'tallas-grandes'

  // Filters — same state as CollectionPage
  const [selectedSizes,  setSelectedSizes]  = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [minPrice,       setMinPrice]       = useState(PRICE_MIN)
  const [maxPrice,       setMaxPrice]       = useState(PRICE_MAX)
  const [selectedTelas,  setSelectedTelas]  = useState([])
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [openSection,    setOpenSection]    = useState({
    category: true, sizes: true, color: true, price: true, tela: true,
  })

  const filters = useMemo(() => ({
    category,
    sizes:    selectedSizes.length  ? selectedSizes  : undefined,
    colors:   selectedColors.length ? selectedColors : undefined,
    minPrice: minPrice > PRICE_MIN  ? minPrice       : undefined,
    maxPrice: maxPrice < PRICE_MAX  ? maxPrice       : undefined,
    fabric:   selectedTelas.length  ? selectedTelas  : undefined,
  }), [selectedSizes, selectedColors, minPrice, maxPrice, selectedTelas])

  const { products, loading } = useProducts(filters)

  useEffect(() => { document.title = 'Tallas Grandes | Bialy' }, [])

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
      {/* Hero — full-bleed, clears fixed header internally */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(420px, 60vw, 720px)', marginTop: 0 }}
      >
        <img
          src="/images/banner-tallas-grandes.jpg"
          alt="Tallas Grandes"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6" style={{ paddingTop: 'var(--header-h)' }}>
          <p className="eyebrow text-white/60 mb-4">Tallas S a 4XL</p>
          <h1
            className="font-display text-white tracking-heading mb-5"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 5rem)', lineHeight: 1.0 }}
          >
            Moda para todas<br />las mujeres.
          </h1>
          <p className="font-sans text-white/75 text-base md:text-lg max-w-xl leading-relaxed mb-8">
            Cada cuerpo merece sentirse extraordinario. Prendas diseñadas pensando en cada curva.
          </p>
          <a
            href="#tg-grid"
            className="btn-hero"
            onClick={e => { e.preventDefault(); document.getElementById('tg-grid')?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            Ver colección
          </a>
        </div>
      </div>

      <div className="container-brand">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Tallas Grandes' },
        ]} />
      </div>

      {/* Values strip */}
      <div className="bg-brand-gray py-8 md:py-10">
        <div className="container-brand">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { title: 'Tallas S – 4XL', desc: 'Ropa diseñada para todos los cuerpos, sin excepción' },
              { title: 'Tejidos Premium', desc: 'Materiales que abrazan, no comprimen. Comodidad real.' },
              { title: 'Diseño Inclusivo', desc: 'Patrones creados específicamente para curvas generosas' },
            ].map(v => (
              <div key={v.title} data-aos="fade-up">
                <p className="font-display text-xl md:text-2xl tracking-heading mb-2">{v.title}</p>
                <p className="font-sans text-sm text-brand-black/55 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product grid with sidebar ── */}
      <section id="tg-grid" className="py-10 md:py-14 bg-brand-white">
        <div className="w-full px-4 sm:px-5 md:px-8 xl:px-12 max-w-[1800px] mx-auto">

          {/* Toolbar */}
          <div className="flex items-center justify-between py-4 border-b border-brand-border mb-8 gap-4">
            <div className="flex items-center gap-3">
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
              <p className="hidden md:block eyebrow mb-0">Tallas Grandes</p>
            </div>
            <span className="font-sans text-sm text-brand-black/50">
              {loading ? '…' : `${products.length} productos`}
            </span>
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
            {/* Desktop sidebar */}
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

            {/* Product grid */}
            <div className="flex-1 min-w-0">
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
                  {[...products]
                    .sort((a, b) => {
                      const aOut = a.is_available === false
                      const bOut = b.is_available === false
                      if (aOut === bOut) return 0
                      return aOut ? 1 : -1
                    })
                    .map((p, i) => (
                      <ProductCard key={p.id} product={p} aosDelay={i * 60} />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mid editorial banner */}
      <section className="py-12 md:py-16 bg-brand-black text-white">
        <div className="container-brand text-center">
          <p className="eyebrow text-white/40 mb-4" data-aos="fade-up">Nuestra promesa</p>
          <h2
            className="font-display text-white tracking-heading mb-6"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3.5rem)', lineHeight: 1.05 }}
            data-aos="fade-up"
            data-aos-delay="80"
          >
            "La talla no define<br />tu elegancia."
          </h2>
          <p
            className="font-sans text-white/55 max-w-xl mx-auto leading-relaxed mb-8"
            data-aos="fade-up"
            data-aos-delay="160"
          >
            Creemos que cada mujer merece acceso a moda de calidad, sin importar su talla. Por eso diseñamos cada prenda con el mismo cuidado y detalle para todas.
          </p>
          <Link to="/collections" className="btn-ghost border-white/30 text-white hover:bg-white hover:text-brand-black" data-aos="fade-up" data-aos-delay="240">
            Ver todas las colecciones
          </Link>
        </div>
      </section>

      {/* Mobile filter drawer */}
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
