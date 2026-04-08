import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AOS from 'aos'

import ScrollToTop          from './components/shared/ScrollToTop.jsx'
import AnnouncementBar      from './components/layout/AnnouncementBar.jsx'
import Navbar               from './components/layout/Navbar.jsx'
import Footer               from './components/layout/Footer.jsx'
import WhatsAppButton       from './components/shared/WhatsAppButton.jsx'
import CartDrawer           from './components/cart/CartDrawer.jsx'

import Home                 from './pages/Home.jsx'
import CollectionPage       from './pages/CollectionPage.jsx'
import TallasGrandesPage    from './pages/TallasGrandesPage.jsx'
import ProductPage          from './pages/ProductPage.jsx'
import CartPage             from './pages/CartPage.jsx'
import CheckoutPage                from './pages/CheckoutPage.jsx'
import OrderConfirmationPage       from './pages/OrderConfirmationPage.jsx'
import AccountOrdersPage          from './pages/AccountOrdersPage.jsx'
import AccountLoginPage           from './pages/AccountLoginPage.jsx'
import AccountCallbackPage        from './pages/AccountCallbackPage.jsx'
import AccountCompleteProfilePage from './pages/AccountCompleteProfilePage.jsx'

import NotFoundPage      from './pages/NotFoundPage.jsx'
import ContactPage       from './pages/ContactPage.jsx'
import FaqPage           from './pages/FaqPage.jsx'
import SizeGuidePage     from './pages/SizeGuidePage.jsx'
import PrivacyPage       from './pages/PrivacyPage.jsx'
import TermsPage         from './pages/TermsPage.jsx'

import AdminLoginPage    from './pages/admin/AdminLoginPage.jsx'
import AdminOrdersPage   from './pages/admin/AdminOrdersPage.jsx'
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx'
import AdminReviewsPage  from './pages/admin/AdminReviewsPage.jsx'
import AdminHomePage     from './pages/admin/AdminHomePage.jsx'

export const HEADER_H = { mobile: 96, desktop: 112 }

export default function App() {
  const { pathname } = useLocation()
  const isAdmin              = pathname.startsWith('/admin')
  const isHome               = pathname === '/'
  const isCheckout           = pathname === '/checkout'
  const isOrderConfirmation  = pathname === '/order-confirmation'
  const isMinimalHeader      = isAdmin || isCheckout || isOrderConfirmation

  // Pages with their own full-bleed hero that handle header clearance internally
  const isFullBleedHero = !isMinimalHeader && (isHome || pathname === '/collections/tallas-grandes')

  // Collapse announcement bar on scroll (not on minimal-header pages)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    if (isMinimalHeader) { setScrolled(false); return }
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMinimalHeader])

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

      {/* Global cart drawer — not rendered in admin */}
      {!isAdmin && <CartDrawer />}

      {/* Fixed header — admin + minimal-header pages manage their own header */}
      {!isMinimalHeader && (
        <div className="fixed inset-x-0 top-0 z-50">
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
        isMinimalHeader ? '' :
        isFullBleedHero ? '' :
        'pt-24 md:pt-28'
      }>
        <Routes>
          {/* ── Admin ── */}
          <Route path="/admin/login"      element={<AdminLoginPage />} />
          <Route path="/admin"            element={<AdminOrdersPage />} />
          <Route path="/admin/productos"  element={<AdminProductsPage />} />
          <Route path="/admin/home"       element={<AdminHomePage />} />
          <Route path="/admin/resenas"    element={<AdminReviewsPage />} />

          {/* ── Storefront ── */}
          <Route path="/"                              element={<Home />} />
          <Route path="/collections"                   element={<Navigate to="/collections/nueva-coleccion" replace />} />
          <Route path="/collections/nueva-coleccion"   element={<CollectionPage category="nueva-coleccion" />} />
          <Route path="/collections/vestidos"          element={<CollectionPage category="vestidos" />} />
          <Route path="/collections/blusas"            element={<CollectionPage category="blusas" />} />
          <Route path="/collections/basicas"           element={<CollectionPage category="blusas" />} />
          <Route path="/collections/jeans"             element={<CollectionPage category="jeans" />} />
          <Route path="/collections/pantalones"        element={<CollectionPage category="jeans" />} />
          <Route path="/collections/rebajas"           element={<CollectionPage category="rebajas" />} />
          <Route path="/collections/accesorios"        element={<CollectionPage category="accesorios" />} />
          <Route path="/collections/basicos-esenciales" element={<CollectionPage category="basicos-esenciales" />} />
          <Route path="/collections/temporada-calida"  element={<CollectionPage category="temporada-calida" />} />
          <Route path="/collections/uniformes"         element={<CollectionPage category="uniformes" />} />
          <Route path="/collections/bono-regalo"       element={<CollectionPage category="bono-regalo" />} />
          <Route path="/collections/tallas-grandes"    element={<TallasGrandesPage />} />
          <Route path="/products/:slug"                element={<ProductPage />} />
          <Route path="/cart"                          element={<CartPage />} />
          <Route path="/checkout"                      element={<CheckoutPage />} />
          <Route path="/order-confirmation"            element={<OrderConfirmationPage />} />
          <Route path="/mi-cuenta/pedidos"             element={<AccountOrdersPage />} />
          <Route path="/cuenta/login"                  element={<AccountLoginPage />} />
          <Route path="/cuenta/callback"               element={<AccountCallbackPage />} />
          <Route path="/cuenta/completar-perfil"       element={<AccountCompleteProfilePage />} />

          {/* ── Info pages ── */}
          <Route path="/contacto"       element={<ContactPage />} />
          <Route path="/faq"            element={<FaqPage />} />
          <Route path="/guia-tallas"    element={<SizeGuidePage />} />
          <Route path="/privacidad"     element={<PrivacyPage />} />
          <Route path="/terminos"       element={<TermsPage />} />

          {/* ── 404 catch-all ── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isMinimalHeader && <Footer />}
      {!isMinimalHeader && <WhatsAppButton />}
    </>
  )
}
