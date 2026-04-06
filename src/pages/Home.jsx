import Hero from '../components/home/Hero.jsx'
import MarqueeTicker from '../components/home/MarqueeTicker.jsx'
import FeaturedCollections from '../components/home/FeaturedCollections.jsx'
import EditorialSplit from '../components/home/EditorialSplit.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import TestimonialsCarousel from '../components/home/TestimonialsCarousel.jsx'
import InstagramGrid from '../components/home/InstagramGrid.jsx'

export default function Home() {
  return (
    <>
      <Hero />
      <MarqueeTicker />
      <FeaturedCollections />
      <EditorialSplit />
      <FeaturedProducts />
      <TestimonialsCarousel />
      <InstagramGrid />
    </>
  )
}
