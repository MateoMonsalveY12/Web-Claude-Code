import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'

function fmt(n) {
  return '$ ' + n.toLocaleString('es-CO')
}

export default function ProductCard({ product, aosDelay = 0 }) {
  const { name, slug, price, compare_price, images, badge, colors, sizes, is_available } = product
  const soldOut = is_available === false
  const img  = images?.[0] || '/images/product-1.jpg'
  const img2 = images?.[1] || null

  const { addToCart } = useCart()
  const [hoverSize,      setHoverSize]      = useState(null)
  const [imgHovered,     setImgHovered]     = useState(false)
  const [hasSecondImage, setHasSecondImage] = useState(false)

  // Preload second image to confirm it actually exists before activating crossfade
  useEffect(() => {
    if (!img2) { setHasSecondImage(false); return }
    const preload = new window.Image()
    preload.onload  = () => setHasSecondImage(true)
    preload.onerror = () => setHasSecondImage(false)
    preload.src = img2
  }, [img2])

  function handleQuickAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    if (soldOut) return
    addToCart(product, hoverSize || sizes?.[0] || null, colors?.[0] || null)
  }

  function handleSizeClick(e, s) {
    e.preventDefault()
    e.stopPropagation()
    setHoverSize(s)
  }

  return (
    <article
      data-aos="fade-up"
      data-aos-delay={aosDelay}
      className="group"
      onMouseLeave={() => { setHoverSize(null); setImgHovered(false) }}
    >
      {/* ── Image block ── */}
      <div
        className="relative overflow-hidden aspect-[3/4] bg-brand-gray mb-3"
        onMouseEnter={() => setImgHovered(true)}
      >
        <Link to={`/products/${slug}`} className="absolute inset-0" tabIndex={-1} aria-hidden="true">
          {/* Primary image */}
          <img
            src={img}
            alt={name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.04]"
            style={{ opacity: imgHovered && hasSecondImage ? 0 : 1 }}
          />
          {/* Secondary image — only shown if it successfully loaded */}
          {hasSecondImage && (
            <img
              src={img2}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              style={{ opacity: imgHovered ? 1 : 0 }}
            />
          )}
        </Link>

        {/* Sold out overlay */}
        {soldOut && (
          <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center pointer-events-none">
            <span className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-brand-black/50 bg-white/90 px-3 py-1 border border-brand-border">
              AGOTADO
            </span>
          </div>
        )}

        {/* Badge */}
        {badge && !soldOut && (
          <span className={`absolute top-3 left-3 z-10 ${badge.startsWith('REBAJAS') ? 'badge-promo' : 'badge-new'}`}>
            {badge}
          </span>
        )}

        {/* Size chips — slide up from bottom on hover (hidden when sold out) */}
        {sizes?.length > 0 && !soldOut && (
          <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="bg-white/96 px-2 pt-2 pb-2 flex gap-1 items-end">
              <div className="flex flex-wrap gap-1 flex-1">
                {sizes.map(s => (
                  <button
                    key={s}
                    onClick={e => handleSizeClick(e, s)}
                    className={`font-sans text-[0.6rem] font-medium px-1.5 py-1 border min-w-[1.625rem] text-center transition-colors duration-100 ${
                      hoverSize === s
                        ? 'bg-brand-black text-white border-brand-black'
                        : 'bg-white text-brand-black border-brand-border hover:border-brand-black'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={handleQuickAdd}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-white border border-brand-border hover:bg-brand-black hover:text-white hover:border-brand-black transition-colors duration-150 font-sans text-base leading-none ml-1"
                aria-label="Añadir al carrito"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Fallback when no sizes (hidden when sold out) */}
        {(!sizes || sizes.length === 0) && !soldOut && (
          <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-brand-black text-brand-white py-3 text-center text-[0.75rem] font-sans font-bold uppercase tracking-button hover:bg-brand-black/85 transition-colors duration-150"
            >
              Añadir al carrito
            </button>
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <Link to={`/products/${slug}`} className="block">
        <h3 className="text-[0.75rem] font-sans font-medium tracking-[0.06em] mb-1.5 hover:opacity-60 transition-opacity duration-200 line-clamp-2 uppercase leading-snug">
          {name}
        </h3>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-sans font-semibold">{fmt(price)}</span>
          {compare_price && (
            <span className="text-xs font-sans text-brand-black/40 line-through">{fmt(compare_price)}</span>
          )}
        </div>
      </Link>

      {/* Color swatches */}
      {colors?.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          {colors.map((c, i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full border border-brand-border/60 inline-block"
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
