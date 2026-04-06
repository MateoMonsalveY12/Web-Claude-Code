import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

const COLLECTIONS_MENU = {
  cols: [
    {
      heading: 'Por tipo',
      links: [
        { label: 'Vestidos',           href: '/collections/vestidos' },
        { label: 'Blusas',             href: '/collections/blusas' },
        { label: 'Jeans & Pantalones', href: '/collections/jeans' },
        { label: 'Tallas Grandes',     href: '/collections/tallas-grandes' },
      ],
    },
    {
      heading: 'Colecciones',
      links: [
        { label: 'Nueva Colección',    href: '/collections/nueva-coleccion' },
        { label: 'Básicos Esenciales', href: '/collections/blusas' },
        { label: 'Temporada Cálida',   href: '/collections/vestidos' },
        { label: 'Ver todo →',         href: '/collections' },
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
      heading: 'Vestidos',
      links: [
        { label: 'Vestidos Cortos',  href: '/collections/vestidos' },
        { label: 'Vestidos Largos',  href: '/collections/vestidos' },
        { label: 'Vestidos Midi',    href: '/collections/vestidos' },
        { label: 'Vestidos de Gala', href: '/collections/vestidos' },
      ],
    },
    {
      heading: 'Más categorías',
      links: [
        { label: 'Blusas Elegantes',   href: '/collections/blusas' },
        { label: 'Jeans & Pantalones', href: '/collections/jeans' },
        { label: 'Tallas Grandes',     href: '/collections/tallas-grandes' },
        { label: 'Ver todo →',         href: '/collections' },
      ],
    },
  ],
  images: [
    { src: '/images/megamenu-campaign-2.jpg', caption: 'Lo más vendido' },
    { src: '/images/banner-blusas.jpg',       caption: 'Blusas 2026' },
  ],
}

export default function Navbar() {
  const [scrolled, setScrolled]             = useState(false)
  const [activeMenu, setActiveMenu]         = useState(null)
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const location   = useLocation()
  const closeTimer = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close on every navigation — no lock needed with the new hover logic
  useEffect(() => {
    setMobileOpen(false)
    setActiveMenu(null)
  }, [location])

  // ── Hover helpers ─────────────────────────────────────────────────────────
  // The header element wraps BOTH the nav items and the megamenus.
  // onMouseLeave on the header is the ONLY place scheduleClose fires,
  // so gaps between nav items never accidentally trigger a close.

  function scheduleClose() {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setActiveMenu(null), 200)
  }

  function cancelClose() {
    clearTimeout(closeTimer.current)
  }

  function openSubmenu(name) {
    cancelClose()
    setActiveMenu(name)
  }

  function closeSubmenu() {
    cancelClose()
    setActiveMenu(null)
  }

  const isHeroTransparent = !scrolled && location.pathname === '/'
  const textColor = isHeroTransparent ? 'text-white' : 'text-brand-black'

  return (
    <>
      {/* ── Nav bar ────────────────────────────────────────────────────────
          The header is the single hover container for nav + megamenus.
          onMouseLeave fires only when the cursor exits the whole header
          (including the megamenu, which is position:absolute inside it). */}
      <header
        className="relative left-0 right-0 border-b border-transparent transition-[background-color,border-color] duration-300"
        onMouseLeave={scheduleClose}
        data-scrolled={String(scrolled)}
      >
        {/* White background layer (fades in when scrolled / off home) */}
        <div
          className="absolute inset-0 bg-brand-white -z-10 transition-opacity duration-300"
          style={{ opacity: scrolled || location.pathname !== '/' ? 1 : 0 }}
          aria-hidden="true"
        />
        {/* Bottom border */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-brand-border transition-opacity duration-300"
          style={{ opacity: scrolled || location.pathname !== '/' ? 1 : 0 }}
          aria-hidden="true"
        />

        <div className="container-brand flex items-center justify-between h-14 md:h-[72px]">
          {/* Logo */}
          <Link
            to="/"
            className={`font-sans text-sm md:text-base tracking-[0.18em] font-semibold uppercase transition-colors duration-300 z-10 ${textColor}`}
            aria-label="Ir al inicio"
          >
            TU MARCA
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex self-stretch items-center gap-7" aria-label="Navegación principal">
            {/* Items WITH megamenu — open on enter */}
            <div
              className="self-stretch flex items-center"
              onMouseEnter={() => openSubmenu('collections')}
            >
              <Link to="/collections" className={`nav-link transition-colors duration-300 ${textColor}`}>
                Colecciones
              </Link>
            </div>

            <div
              className="self-stretch flex items-center"
              onMouseEnter={() => openSubmenu('products')}
            >
              <span className={`nav-link cursor-default transition-colors duration-300 ${textColor}`}>
                Productos
              </span>
            </div>

            {/* Items WITHOUT megamenu — close any open menu on enter */}
            <Link
              to="/collections/tallas-grandes"
              className={`nav-link transition-colors duration-300 ${textColor}`}
              onMouseEnter={closeSubmenu}
            >
              Tallas Grandes
            </Link>
            <a
              href="#footer-contact"
              className={`nav-link transition-colors duration-300 ${textColor}`}
              onMouseEnter={closeSubmenu}
            >
              Contacto
            </a>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1">
            <button className={`nav-icon-btn transition-colors duration-300 ${textColor}`} aria-label="Buscar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button className={`nav-icon-btn transition-colors duration-300 ${textColor}`} aria-label="Carrito">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </button>
            <button
              className={`md:hidden nav-icon-btn transition-colors duration-300 ${textColor}`}
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Megamenus — inside the header so onMouseLeave on header covers them */}
        <MegaMenu
          data={COLLECTIONS_MENU}
          open={activeMenu === 'collections'}
          onMouseEnter={cancelClose}
        />
        <MegaMenu
          data={PRODUCTS_MENU}
          open={activeMenu === 'products'}
          onMouseEnter={cancelClose}
        />
      </header>

      {/* Backdrop — purely visual, pointer-events: none so it never intercepts events */}
      <div
        className="fixed inset-0 bg-black/20 transition-opacity duration-200"
        style={{
          opacity: activeMenu ? 1 : 0,
          pointerEvents: 'none',
          zIndex: 45,
        }}
        aria-hidden="true"
      />

      {/* ── Mobile menu ─────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-brand-white flex flex-col overflow-y-auto transition-transform duration-300 md:hidden"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)', zIndex: 100 }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <Link to="/" className="font-sans text-sm tracking-[0.18em] font-semibold uppercase">TU MARCA</Link>
          <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-0">
          <MobileAccordion
            label="Colecciones"
            open={mobileExpanded === 'collections'}
            onToggle={() => setMobileExpanded(mobileExpanded === 'collections' ? null : 'collections')}
          >
            <ul className="space-y-4 pb-4 pl-1">
              {[
                { label: 'Nueva Colección',    href: '/collections/nueva-coleccion' },
                { label: 'Vestidos',           href: '/collections/vestidos' },
                { label: 'Blusas',             href: '/collections/blusas' },
                { label: 'Jeans & Pantalones', href: '/collections/jeans' },
              ].map(l => (
                <li key={l.label}><Link to={l.href} className="font-sans text-sm text-brand-black/70">{l.label}</Link></li>
              ))}
            </ul>
          </MobileAccordion>

          <MobileAccordion
            label="Productos"
            open={mobileExpanded === 'products'}
            onToggle={() => setMobileExpanded(mobileExpanded === 'products' ? null : 'products')}
          >
            <ul className="space-y-4 pb-4 pl-1">
              {[
                { label: 'Vestidos Cortos',    href: '/collections/vestidos' },
                { label: 'Vestidos Largos',    href: '/collections/vestidos' },
                { label: 'Vestidos Midi',      href: '/collections/vestidos' },
                { label: 'Blusas',             href: '/collections/blusas' },
              ].map(l => (
                <li key={l.label}><Link to={l.href} className="font-sans text-sm text-brand-black/70">{l.label}</Link></li>
              ))}
            </ul>
          </MobileAccordion>

          <Link to="/collections/tallas-grandes" className="flex items-center py-4 border-b border-brand-border nav-link text-brand-black">
            Tallas Grandes
          </Link>
          <a href="#footer-contact" className="flex items-center py-4 border-b border-brand-border nav-link text-brand-black" onClick={() => setMobileOpen(false)}>
            Contacto
          </a>
        </div>

        <div className="px-5 pb-8 pt-4 border-t border-brand-border space-y-3">
          <p className="font-sans text-xs text-brand-black/40 uppercase tracking-button mb-3">Atención al cliente</p>
          <a href="https://wa.me/573001234567" className="flex items-center gap-2 font-sans text-sm text-brand-black">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp: 300 123 4567
          </a>
        </div>
      </div>
    </>
  )
}

function MegaMenu({ data, open, onMouseEnter }) {
  return (
    <div
      className={`megamenu${open ? ' megamenu--open' : ''}`}
      onMouseEnter={onMouseEnter}
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
              <div className="aspect-[3/4] overflow-hidden">
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
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', flexShrink: 0 }}
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
