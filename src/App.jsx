import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AOS from 'aos'

import AnnouncementBar from './components/layout/AnnouncementBar.jsx'
import Navbar from './components/layout/Navbar.jsx'
import Footer from './components/layout/Footer.jsx'

import Home from './pages/Home.jsx'
import CollectionPage from './pages/CollectionPage.jsx'
import TallasGrandesPage from './pages/TallasGrandesPage.jsx'
import ProductPage from './pages/ProductPage.jsx'

export default function App() {
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
      <AnnouncementBar />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Navigate to="/collections/nueva-coleccion" replace />} />
          <Route path="/collections/nueva-coleccion" element={<CollectionPage category="nueva-coleccion" />} />
          <Route path="/collections/vestidos" element={<CollectionPage category="vestidos" />} />
          <Route path="/collections/blusas" element={<CollectionPage category="blusas" />} />
          <Route path="/collections/jeans" element={<CollectionPage category="jeans" />} />
          <Route path="/collections/pantalones" element={<CollectionPage category="jeans" />} />
          <Route path="/collections/tallas-grandes" element={<TallasGrandesPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
