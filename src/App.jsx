import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AOS from 'aos'

import ScrollToTop     from './components/shared/ScrollToTop.jsx'
import AnnouncementBar from './components/layout/AnnouncementBar.jsx'
import Navbar          from './components/layout/Navbar.jsx'
import Footer          from './components/layout/Footer.jsx'
import WhatsAppButton  from './components/shared/WhatsAppButton.jsx'

import Home            from './pages/Home.jsx'
import CollectionPage  from './pages/CollectionPage.jsx'
import TallasGrandesPage from './pages/TallasGrandesPage.jsx'
import ProductPage     from './pages/ProductPage.jsx'

// Height of the fixed header stack:
//   AnnouncementBar  ≈ 40px  (py-2.5 + text)
//   Navbar mobile    = 56px  (h-14)
//   Navbar desktop   = 72px  (h-[72px])
// Total: 96px mobile / 112px desktop
export const HEADER_H = { mobile: 96, desktop: 112 }

export default function App() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  // Pages with their own full-bleed hero that handles header clearance internally
  const isFullBleedHero = isHome || pathname === '/collections/tallas-grandes'

  useEffect(() => {
    AOS.init({
      duration: 750,
      easing: 'ease-out-quad',
      once: true,
      offset: 40,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
  }, [])

  return (
    <>
      {/* ── Fixed header stack ─────────────────────────────────────
          Both bars fixed together so neither overlaps the other.
          Navbar no longer declares its own position:fixed.         */}
      <ScrollToTop />
      <div className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <Navbar />
      </div>

      {/* ── Main content ──────────────────────────────────────────
          Home: no padding-top → hero covers full viewport behind
                the fixed header stack.
          All other pages: pad down to clear the header.           */}
      <main className={isFullBleedHero ? '' : 'pt-24 md:pt-28'}>
        <Routes>
          <Route path="/"                        element={<Home />} />
          <Route path="/collections"             element={<Navigate to="/collections/nueva-coleccion" replace />} />
          <Route path="/collections/nueva-coleccion" element={<CollectionPage category="nueva-coleccion" />} />
          <Route path="/collections/vestidos"    element={<CollectionPage category="vestidos" />} />
          <Route path="/collections/blusas"      element={<CollectionPage category="blusas" />} />
          <Route path="/collections/jeans"       element={<CollectionPage category="jeans" />} />
          <Route path="/collections/pantalones"  element={<CollectionPage category="jeans" />} />
          <Route path="/collections/tallas-grandes" element={<TallasGrandesPage />} />
          <Route path="/products/:slug"          element={<ProductPage />} />
        </Routes>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
