import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AOS from 'aos'

import ScrollToTop       from './components/shared/ScrollToTop.jsx'
import AnnouncementBar   from './components/layout/AnnouncementBar.jsx'
import Navbar            from './components/layout/Navbar.jsx'
import Footer            from './components/layout/Footer.jsx'
import WhatsAppButton    from './components/shared/WhatsAppButton.jsx'
import CartDrawer        from './components/cart/CartDrawer.jsx'

import Home              from './pages/Home.jsx'
import CollectionPage    from './pages/CollectionPage.jsx'
import TallasGrandesPage from './pages/TallasGrandesPage.jsx'
import ProductPage       from './pages/ProductPage.jsx'
import CartPage          from './pages/CartPage.jsx'
import CheckoutPage      from './pages/CheckoutPage.jsx'

export const HEADER_H = { mobile: 96, desktop: 112 }

export default function App() {
  const { pathname } = useLocation()
  const isHome     = pathname === '/'
  const isCheckout = pathname === '/checkout'

  // Pages with their own full-bleed hero that handles header clearance internally
  const isFullBleedHero = !isCheckout && (isHome || pathname === '/collections/tallas-grandes')

  // Collapse announcement bar on scroll (not needed on checkout)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    if (isCheckout) { setScrolled(false); return }
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isCheckout])

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
      <ScrollToTop />

      {/* Global cart drawer — available on every page */}
      <CartDrawer />

      {/* Fixed header — checkout has its own minimal header */}
      {!isCheckout && (
        <div className="fixed inset-x-0 top-0 z-50">
          {/* Announcement bar collapses smoothly on scroll */}
          <div
            style={{
              maxHeight: scrolled ? '0px' : '40px',
              overflow: 'hidden',
              transition: 'max-height 300ms ease-out',
            }}
          >
            <AnnouncementBar />
          </div>
          <Navbar />
        </div>
      )}

      <main className={
        isCheckout      ? '' :
        isFullBleedHero ? '' :
        'pt-24 md:pt-28'
      }>
        <Routes>
          <Route path="/"                            element={<Home />} />
          <Route path="/collections"                 element={<Navigate to="/collections/nueva-coleccion" replace />} />
          <Route path="/collections/nueva-coleccion" element={<CollectionPage category="nueva-coleccion" />} />
          <Route path="/collections/vestidos"        element={<CollectionPage category="vestidos" />} />
          <Route path="/collections/blusas"          element={<CollectionPage category="blusas" />} />
          <Route path="/collections/jeans"           element={<CollectionPage category="jeans" />} />
          <Route path="/collections/pantalones"      element={<CollectionPage category="jeans" />} />
          <Route path="/collections/tallas-grandes"  element={<TallasGrandesPage />} />
          <Route path="/products/:slug"              element={<ProductPage />} />
          <Route path="/cart"                        element={<CartPage />} />
          <Route path="/checkout"                    element={<CheckoutPage />} />
        </Routes>
      </main>

      {!isCheckout && <Footer />}
      {!isCheckout && <WhatsAppButton />}
    </>
  )
}
