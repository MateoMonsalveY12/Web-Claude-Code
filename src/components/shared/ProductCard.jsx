import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'

function formatPrice(n) {
  return '$' + n.toLocaleString('es-CO')
}

export default function ProductCard({ product, aosDelay = 0 }) {
  const { name, slug, price, compare_price, images, badge, colors, sizes } = product
  const img = images?.[0] || '/images/product-1.jpg'
  const { addToCart } = useCart()

  function handleQuickAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    const size  = sizes?.[0]  || null
    const color = colors?.[0] || null
    addToCart(product, size, color)
  }

  return (
    <article
      data-aos="fade-up"
      data-aos-delay={aosDelay}
      className="group"
    >
      {/* Image + hover overlay */}
      <div className="relative overflow-hidden aspect-[3/4] bg-brand-gray mb-3">
        <Link to={`/products/${slug}`} className="block w-full h-full" tabIndex={-1} aria-hidden="true">
          <img
            src={img}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badge */}
        {badge && (
          <span className={`absolute top-3 left-3 ${badge.startsWith('REBAJAS') ? 'badge-promo' : 'badge-new'}`}>
            {badge}
          </span>
        )}

        {/* Hover overlay — slides up from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
        >
          {/* Añadir al carrito */}
          <button
            onClick={handleQuickAdd}
            className="w-full bg-brand-black text-brand-white py-3 text-center text-[0.75rem] font-sans font-bold uppercase tracking-button hover:bg-brand-black/85 transition-colors duration-150"
          >
            Añadir al carrito
          </button>
          {/* Ver producto */}
          <Link
            to={`/products/${slug}`}
            className="block w-full bg-brand-white text-brand-black py-2.5 text-center text-[0.7rem] font-sans font-semibold uppercase tracking-button border-t border-brand-border hover:bg-brand-gray transition-colors duration-150"
          >
            Ver producto
          </Link>
        </div>
      </div>

      {/* Info */}
      <Link to={`/products/${slug}`} className="block">
        <h3 className="text-sm font-medium tracking-heading mb-1.5 hover:opacity-60 transition-opacity duration-200 line-clamp-2 uppercase">
          {name}
        </h3>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold">{formatPrice(price)}</span>
          {compare_price && (
            <span className="text-xs text-brand-black/40 line-through">{formatPrice(compare_price)}</span>
          )}
        </div>
      </Link>

      {/* Color swatches */}
      {colors?.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          {colors.map((c, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-full border border-brand-border inline-block"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      )}
    </article>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-brand-gray mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-brand-gray w-3/4" />
        <div className="h-3 bg-brand-gray w-1/3" />
      </div>
    </div>
  )
}
