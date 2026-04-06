import { Link } from 'react-router-dom'
import ProductCard, { SkeletonCard } from '../shared/ProductCard.jsx'
import { useProducts } from '../../hooks/useProducts.js'

export default function FeaturedProducts() {
  const { products, loading } = useProducts({ featured: true, limit: 4 })

  return (
    <section id="products" className="py-10 md:py-16 bg-brand-gray">
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
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p, i) => (
                <ProductCard key={p.id} product={p} aosDelay={i * 60} />
              ))
          }
        </div>
      </div>
    </section>
  )
}
