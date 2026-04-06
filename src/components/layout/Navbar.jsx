import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

const COLLECTIONS_MENU = {
  cols: [
    {
      heading: 'Por tipo',
      links: [
        { label: 'Vestidos',       href: '/collections/vestidos' },
        { label: 'Blusas',         href: '/collections/blusas' },
        { label: 'Jeans',          href: '/collections/jeans' },
        { label: 'Tallas Grandes', href: '/collections/tallas-grandes' },
      ],
    },
    {
      heading: 'Colecciones',
      links: [
        { label: 'Nueva Colección',   href: '/collections/nueva-coleccion' },
        { label: 'Básicos Esenciales',href: '/collections/blusas' },
        { label: 'Temporada Cálida',  href: '/collections/vestidos' },
        { label: 'Ver todo',          href: '/collections' },
      ],
    },
  ],
  images: [
    { src: '/images/megamenu-campaign-1.jpg', caption: 'Nueva Temporada' },
    { src: '/images/banner-vestidos.jpg',     caption: 'Vestidos 2026' },
  ],
}

const PRODUCTS_MENU = {
  cols: [
    {
      heading: 'Ropa',
      links: [
        { label: 'Vestidos Cortos',  href: '/collections/vestidos' },
        { label: 'Vestidos Largos',  href: '/collections/vestidos' },
        { label: 'Blusas Casuales',  href: '/collections/blusas' },
        { label: 'Blusas Elegantes', href: '/collections/blusas' },
      ],
    },
    {
      heading: 'Pantalones',
      links: [
        { label: 'Jeans Clásicos',  href: '/collections/jeans' },
        { label: 'Pantalón Cargo',  href: '/collections/jeans' },
        { label: 'Wide Leg',        href: '/collections/jeans' },
        { label: 'Tallas Grandes',  href: '/collections/tallas-grandes' },
      ],
    },
  ],
  images: [
    { src: '/images/megamenu-campaign-2.jpg', caption: 'Lo más vendido' },
    { src: '/images/banner-blusas.jpg',       caption: 'Blusas 2026' },
  ],
}

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false)
  const [openMenu, setOpenMenu]       = useState(null) // 'collections' | 'products' | null
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const location = useLocation()
  const closeTimer = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false); setOpenMenu(null) }, [location])

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 180)
  }
  function cancelClose() {
    clearTimeout(closeTimer.current)
  }

  const isLight = !scrolled && location.pathname === '/'

  return (
    <>
      <header
        id="site-nav"
        className="fixed left-0 right-0 z-50 transition-[background-color,border-color] duration-300"
        style={{ top: 0 }}
        data-scrolled={String(scrolled)}
      >
        {/* Scrolled bg */}
        <div
          className="absolute inset-0 bg-brand-white -z-10 transition-opacity duration-300"
          style={{ opacity: scrolled ? 1 : 0 }}
          aria-hidden="true"
        />
        {/* Scrolled border */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-brand-border transition-opacity duration-300"
          style={{ opacity: scrolled ? 1 : 0 }}
          aria-hidden="true"
        />

        <div className="container-brand flex items-center justify-between h-14 md:h-[72px]">
          {/* Logo */}
          <Link
            to="/"
            className={`font-sans text-sm md:text-base tracking-[0.18em] font-semibold uppercase transition-colors duration-300 z-10 ${isLight ? 'text-white' : 'text-brand-black'}`}
            aria-label="Ir al inicio"
          >
            TU MARCA
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Navegación principal">
            {/* Colecciones megamenu */}
            <div
              className="relative"
              onMouseEnter={() => { cancelClose(); setOpenMenu('collections') }}
              onMouseLeave={scheduleClose}
            >
              <Link
                to="/collections"
                className={`nav-link transition-colors duration-300 ${isLight ? 'text-white' : 'text-brand-black'}`}
              >
                Colecciones
              </Link>
            </div>

            {/* Productos megamenu */}
            <div
              className="relative"
              onMouseEnter={() => { cancelClose(); setOpenMenu('products') }}
              onMouseLeave={scheduleClose}
            >
              <span className={`nav-link cursor-default transition-colors duration-300 ${isLight ? 'text-white' : 'text-brand-black'}`}>
                Productos
              </span>
            </div>

            <Link to="/collections/tallas-grandes" className={`nav-link transition-colors duration-300 ${isLight ? 'text-white' : 'text-brand-black'}`}>
              Tallas Grandes
            </Link>
            <a href="#footer-contact" className={`nav-link transition-colors duration-300 ${isLight ? 'text-white' : 'text-brand-black'}`}>
              Contacto
            </a>
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <button className={`nav-icon-btn transition-colors duration-300 ${isLight ? 'text-white' : 'text-brand-black'}`} aria-label="Buscar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button className={`nav-icon-btn transition-colors duration-300 ${isLight ? 'text-white' : 'text-brand-black'}`} aria-label="Carrito">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </button>
            <button
              className={`md:hidden nav-icon-btn transition-colors duration-300 ${isLight ? 'text-white' : 'text-brand-black'}`}
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Megamenu: Colecciones ────────────────────────── */}
        <MegaMenu
          data={COLLECTIONS_MENU}
          open={openMenu === 'collections'}
          onMouseEnter={() => { cancelClose(); setOpenMenu('collections') }}
          onMouseLeave={scheduleClose}
        />

        {/* ── Megamenu: Productos ──────────────────────────── */}
        <MegaMenu
          data={PRODUCTS_MENU}
          open={openMenu === 'products'}
          onMouseEnter={() => { cancelClose(); setOpenMenu('products') }}
          onMouseLeave={scheduleClose}
        />
      </header>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 pointer-events-none"
        style={{ opacity: openMenu ? 1 : 0, pointerEvents: openMenu ? 'auto' : 'none' }}
        onClick={() => setOpenMenu(null)}
        aria-hidden="true"
      />

      {/* ── Mobile menu ────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[100] bg-brand-white flex flex-col overflow-y-auto transition-transform duration-300 md:hidden"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <Link to="/" className="font-sans text-sm tracking-[0.18em] font-semibold uppercase">TU MARCA</Link>
          <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 px-5 py-6 space-y-1">
          {/* Accordion: Colecciones */}
          <MobileAccordion
            label="Colecciones"
            open={mobileExpanded === 'collections'}
            onToggle={() => setMobileExpanded(mobileExpanded === 'collections' ? null : 'collections')}
          >
            <ul className="space-y-4 pb-4 pl-1">
              <li><Link to="/collections/vestidos" className="text-sm text-brand-black/70">Vestidos</Link></li>
              <li><Link to="/collections/blusas" className="text-sm text-brand-black/70">Blusas</Link></li>
              <li><Link to="/collections/jeans" className="text-sm text-brand-black/70">Jeans & Pantalones</Link></li>
              <li><Link to="/collections/nueva-coleccion" className="text-sm text-brand-black/70">Nueva Colección</Link></li>
            </ul>
          </MobileAccordion>

          {/* Accordion: Productos */}
          <MobileAccordion
            label="Productos"
            open={mobileExpanded === 'products'}
            onToggle={() => setMobileExpanded(mobileExpanded === 'products' ? null : 'products')}
          >
            <ul className="space-y-4 pb-4 pl-1">
              <li><Link to="/collections/vestidos" className="text-sm text-brand-black/70">Vestidos Cortos</Link></li>
              <li><Link to="/collections/vestidos" className="text-sm text-brand-black/70">Vestidos Largos</Link></li>
              <li><Link to="/collections/blusas" className="text-sm text-brand-black/70">Blusas</Link></li>
              <li><Link to="/collections/jeans" className="text-sm text-brand-black/70">Pantalones</Link></li>
            </ul>
          </MobileAccordion>

          <Link to="/collections/tallas-grandes" className="flex items-center py-4 border-b border-brand-border nav-link text-brand-black">
            Tallas Grandes
          </Link>
          <a href="#footer-contact" className="flex items-center py-4 border-b border-brand-border nav-link text-brand-black">
            Contacto
          </a>
        </div>
      </div>
    </>
  )
}

function MegaMenu({ data, open, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className="megamenu"
      style={{
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transform: open ? 'translateY(0)' : 'translateY(-8px)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="container-brand py-8 md:py-10">
        <div className="grid grid-cols-4 gap-8">
          {data.cols.map((col, i) => (
            <div key={i}>
              <p className="megamenu-heading">{col.heading}</p>
              <ul className="megamenu-list">
                {col.links.map((l, j) => (
                  <li key={j}><Link to={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          {data.images.map((img, i) => (
            <div key={i} className="overflow-hidden">
              <div className="overflow-hidden aspect-[3/4]">
                <img
                  src={img.src}
                  alt={img.caption}
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
              <p className="megamenu-caption mt-2">{img.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MobileAccordion({ label, open, onToggle, children }) {
  const ref = useRef(null)
  return (
    <div className="border-b border-brand-border">
      <button
        className="flex items-center justify-between w-full py-4 nav-link text-brand-black text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        {label}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div
        ref={ref}
        style={{
          maxHeight: open ? (ref.current?.scrollHeight ?? 500) + 'px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 300ms ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
