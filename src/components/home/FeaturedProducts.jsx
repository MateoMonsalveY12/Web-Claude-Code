import { Link } from 'react-router-dom'
import ProductCard, { SkeletonCard } from '../shared/ProductCard.jsx'
import { useProducts } from '../../hooks/useProducts.js'

export default function FeaturedProducts() {
  // Primary: ordered by total_sold desc (real bestsellers)
  const { products: topSellers, loading: l1 } = useProducts({
    orderByTotalSold: true,
    limit: 8,
  })

  // Fallback: is_featured products (used when store is new and total_sold = 0)
  const { products: featured, loading: l2 } = useProducts({
    featured: true,
    limit: 8,
  })

  const loading = l1 || l2

  // Decide which set to show
  const hasSales = topSellers.some(p => (p.total_sold ?? 0) > 0)
  const displayProducts = (hasSales ? topSellers : featured)
    .filter(p => p.is_available !== false)
    .slice(0, 8)

  return (
    <section id="products" className="py-16 md:py-24 bg-brand-white">
      <div className="container-brand">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="eyebrow mb-3" data-aos="fade-up">Más vendidos</p>
            <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">
              Los favoritos.
            </h2>
          </div>
          <Link
            to="/collections"
            className="btn-ghost btn-sm self-start sm:self-auto"
            data-aos="fade-up"
            data-aos-delay="120"
          >
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : displayProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} aosDelay={i * 60} />
              ))
          }
        </div>
      </div>
    </section>
  )
}
