import { Link } from 'react-router-dom'

function formatPrice(n) {
  return '$' + n.toLocaleString('es-CO')
}

export default function ProductCard({ product, aosDelay = 0 }) {
  const { name, slug, price, compare_price, images, badge, colors } = product
  const img = images?.[0] || '/assets/images/product-1.jpg'

  return (
    <article
      data-aos="fade-up"
      data-aos-delay={aosDelay}
      className="group"
    >
      <Link to={`/products/${slug}`} className="block" tabIndex={-1} aria-hidden="true">
        {/* Image wrapper */}
        <div className="relative overflow-hidden aspect-[3/4] bg-brand-gray">
          <img
            src={img}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
          />

          {/* Badge */}
          {badge && (
            <span className={`absolute top-3 left-3 text-[0.625rem] font-sans font-semibold uppercase tracking-button px-2.5 py-1 ${badge.startsWith('REBAJAS') ? 'bg-brand-red text-white' : 'bg-brand-black text-white'}`}>
              {badge}
            </span>
          )}

          {/* Hover CTA */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <span className="bg-brand-white text-brand-black font-sans text-xs font-semibold uppercase tracking-button px-6 py-2.5 shadow-md">
              Ver producto
            </span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="pt-3 pb-1">
        <Link to={`/products/${slug}`}>
          <p className="font-sans text-[0.8125rem] font-normal text-brand-black uppercase leading-snug tracking-[0.03em] hover:opacity-60 transition-opacity duration-200 line-clamp-2">
            {name}
          </p>
        </Link>

        {/* Price */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="font-sans text-sm font-semibold text-brand-black">
            {formatPrice(price)}
          </span>
          {compare_price && (
            <span className="font-sans text-xs text-brand-black/40 line-through">
              {formatPrice(compare_price)}
            </span>
          )}
        </div>

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
      </div>
    </article>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-brand-gray" />
      <div className="pt-3 space-y-2">
        <div className="h-3 bg-brand-gray rounded-none w-3/4" />
        <div className="h-3 bg-brand-gray rounded-none w-1/2" />
      </div>
    </div>
  )
}
