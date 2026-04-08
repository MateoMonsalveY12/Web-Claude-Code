import { useEffect } from 'react'
import Hero from '../components/home/Hero.jsx'
import MarqueeTicker from '../components/home/MarqueeTicker.jsx'
import FeaturedCollections from '../components/home/FeaturedCollections.jsx'
import EditorialSplit from '../components/home/EditorialSplit.jsx'
import PromoEditorial from '../components/home/PromoEditorial.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import TestimonialsCarousel from '../components/home/TestimonialsCarousel.jsx'
import InstagramFeed from '../components/home/InstagramFeed.jsx'

export default function Home() {
  useEffect(() => { document.title = 'Bialy | Moda Femenina Colombiana' }, [])
  return (
    <>
      <Hero />
      <MarqueeTicker />
      <FeaturedCollections />
      <EditorialSplit />
      <PromoEditorial />
      <FeaturedProducts />
      <TestimonialsCarousel />
      <InstagramFeed />
    </>
  )
}
