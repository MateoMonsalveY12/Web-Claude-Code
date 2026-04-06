import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProduct } from '../hooks/useProduct.js'
import { useProducts } from '../hooks/useProducts.js'
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard.jsx'
import Breadcrumb from '../components/shared/Breadcrumb.jsx'

function formatPrice(n) {
  return '$' + n.toLocaleString('es-CO')
}

const TRUST = [
  { icon: '🚚', title: 'Envío gratis', desc: 'En pedidos +$200.000' },
  { icon: '↩️', title: '30 días',      desc: 'Devolución sin preguntas' },
  { icon: '🔒', title: 'Pago seguro',  desc: 'Encriptación SSL' },
]

const ACCORDION_ITEMS = [
  { id: 'size',     title: 'Guía de tallas',    content: 'XS = talla 6 · S = talla 8 · M = talla 10 · L = talla 12 · XL = talla 14. Si estás entre dos tallas, elige la más grande para mayor comodidad.' },
  { id: 'material', title: 'Materiales y cuidados', content: 'Lavar a mano o ciclo delicado. No usar blanqueador. Planchar a temperatura baja. Ver etiqueta interior.' },
  { id: 'shipping', title: 'Envíos y devoluciones', content: 'Envío estándar 3–5 días hábiles. Express 1–2 días. Envío gratis en pedidos +$200.000. Devoluciones gratuitas en 30 días.' },
]

export default function ProductPage() {
  const { slug } = useParams()
  const { product, loading, error } = useProduct(slug)
  const [activeImg, setActiveImg]   = useState(0)
  const [selectedSize, setSize]     = useState(null)
  const [selectedColor, setColor]   = useState(null)
  const [openAccordion, setAccordion] = useState(null)
  const [added, setAdded]           = useState(false)
  const [sizeError, setSizeError]   = useState(false)

  const { products: related } = useProducts({ category: product?.category, limit: 5 })

  if (loading) return <ProductPageSkeleton />

  if (error || !product) return (
    <div className="container-brand py-24 text-center">
      <p className="font-sans text-sm text-brand-black/40 mb-4">Producto no encontrado.</p>
      <Link to="/collections" className="btn-primary">Ver colecciones</Link>
    </div>
  )

  const { name, price, compare_price, images, sizes, colors, badge, category, description } = product
  const discount = compare_price ? Math.round((1 - price / compare_price) * 100) : null
  const relatedFiltered = related.filter(p => p.slug !== slug).slice(0, 4)

  function handleAddToCart() {
    if (sizes?.length > 0 && !selectedSize) { setSizeError(true); return }
    setSizeError(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <>
      <div className="container-brand pt-4 pb-2">
        <Breadcrumb items={[
          { label: 'Inicio',    href: '/' },
          { label: category,   href: `/collections/${category}` },
          { label: name.length > 45 ? name.slice(0, 45) + '…' : name },
        ]} />
      </div>

      <div className="container-brand pb-10 md:pb-16">
        <div className="grid md:grid-cols-[55fr_45fr] gap-8 md:gap-14">

          {/* ── Gallery ─────────────────────────────────────────────── */}
          <div>
            {/* Main image */}
            <div className="overflow-hidden aspect-[3/4] bg-brand-gray mb-3">
              <img
                key={activeImg}
                src={images[activeImg] || images[0]}
                alt={name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 aspect-square overflow-hidden border-2 transition-colors duration-150 ${i === activeImg ? 'border-brand-black' : 'border-transparent hover:border-brand-border'}`}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ─────────────────────────────────────────── */}
          <div className="md:sticky md:top-28 self-start">
            {/* Badge */}
            {badge && (
              <span className={`inline-block mb-3 text-[0.625rem] font-sans font-semibold uppercase tracking-button px-2.5 py-1 ${badge.startsWith('REBAJAS') ? 'bg-brand-red text-white' : 'bg-brand-black text-white'}`}>
                {badge}
              </span>
            )}

            {/* Name */}
            <h1
              className="font-display text-brand-black tracking-heading mb-3"
              style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.25rem)', lineHeight: 1.1 }}
            >
              {name}
            </h1>

            {/* Rating stub */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#000">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <span className="font-sans text-xs text-brand-black/50">(24 reseñas)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-sans text-2xl font-semibold text-brand-black">{formatPrice(price)}</span>
              {compare_price && (
                <>
                  <span className="font-sans text-sm text-brand-black/40 line-through">{formatPrice(compare_price)}</span>
                  <span className="font-sans text-xs font-bold text-brand-red">−{discount}%</span>
                </>
              )}
            </div>

            {/* Short description */}
            {description && (
              <p className="font-sans text-sm text-brand-black/60 leading-relaxed mb-6">{description}</p>
            )}

            {/* Colors */}
            {colors?.length > 0 && (
              <div className="mb-5">
                <p className="font-sans text-xs font-semibold uppercase tracking-button text-brand-black/50 mb-2.5">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setColor(c)}
                      title={c}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${selectedColor === c ? 'border-brand-black scale-105' : 'border-brand-border hover:border-brand-black/40'}`}
                      style={{ background: c }}
                      aria-label={c}
                      aria-pressed={selectedColor === c}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <p className={`font-sans text-xs font-semibold uppercase tracking-button ${sizeError ? 'text-brand-red' : 'text-brand-black/50'}`}>
                    {sizeError ? '⚠ Elige una talla' : 'Talla'}
                  </p>
                  <button className="font-sans text-xs text-brand-black/40 underline underline-offset-2 hover:text-brand-black transition-colors">
                    Guía de tallas
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => { setSize(s); setSizeError(false) }}
                      className={`font-sans text-xs px-4 py-2.5 border transition-all duration-150 min-w-[3rem] ${selectedSize === s ? 'bg-brand-black text-white border-brand-black' : 'border-brand-border text-brand-black hover:border-brand-black'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs — desktop */}
            <div className="hidden md:flex flex-col gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                className={`btn-primary w-full text-center transition-all duration-300 ${added ? 'bg-green-800 border-green-800' : ''}`}
              >
                {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
              </button>
              <button className="btn-ghost w-full text-center">
                Comprar ahora
              </button>
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 font-sans text-xs font-semibold uppercase tracking-button text-brand-black/50 hover:text-brand-black transition-colors py-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Consultar por WhatsApp
              </a>
            </div>

            {/* Trust signals */}
            <div className="hidden md:grid grid-cols-3 gap-3 mb-6">
              {TRUST.map(t => (
                <div key={t.title} className="border border-brand-border p-3 text-center">
                  <p className="font-sans text-lg mb-1">{t.icon}</p>
                  <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-button text-brand-black">{t.title}</p>
                  <p className="font-sans text-[0.6875rem] text-brand-black/45 mt-0.5">{t.desc}</p>
                </div>
              ))}
            </div>

            {/* Accordion */}
            <div className="border-t border-brand-border">
              {/* Description always visible */}
              {description && (
                <div className="py-4 border-b border-brand-border">
                  <p className="font-sans text-xs font-semibold uppercase tracking-button text-brand-black/50 mb-2">Descripción</p>
                  <p className="font-sans text-sm text-brand-black/65 leading-relaxed">{description}</p>
                </div>
              )}
              {ACCORDION_ITEMS.map(item => (
                <div key={item.id} className="border-b border-brand-border">
                  <button
                    className="flex items-center justify-between w-full py-4 font-sans text-sm font-semibold text-brand-black text-left"
                    onClick={() => setAccordion(openAccordion === item.id ? null : item.id)}
                    aria-expanded={openAccordion === item.id}
                  >
                    {item.title}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ transform: openAccordion === item.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms', flexShrink: 0 }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <div style={{ maxHeight: openAccordion === item.id ? '400px' : '0', overflow: 'hidden', transition: 'max-height 300ms ease-out' }}>
                    <p className="font-sans text-sm text-brand-black/60 leading-relaxed pb-5">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Related products ──────────────────────────────────────── */}
        {relatedFiltered.length > 0 && (
          <section className="mt-16 md:mt-20 pt-10 border-t border-brand-border">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="eyebrow mb-2">También te puede gustar</p>
                <h2 className="font-display text-2xl md:text-3xl tracking-heading">Más de {category}</h2>
              </div>
              <Link to={`/collections/${category}`} className="font-sans text-xs uppercase tracking-button font-semibold underline underline-offset-4 hover:opacity-50 transition-opacity hidden md:block">
                Ver todo
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {relatedFiltered.map((p, i) => (
                <ProductCard key={p.id} product={p} aosDelay={i * 60} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Sticky mobile CTA ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-border px-4 py-3 flex gap-3 md:hidden">
        <button
          onClick={handleAddToCart}
          className={`flex-1 btn-primary text-center ${added ? 'bg-green-800 border-green-800' : ''}`}
        >
          {added ? '✓ Agregado' : 'Agregar al carrito'}
        </button>
        <a
          href="https://wa.me/573001234567"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 bg-[#25D366] text-white"
          aria-label="WhatsApp"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      </div>
      {/* Bottom padding to clear sticky CTA on mobile */}
      <div className="h-20 md:hidden" />
    </>
  )
}

function ProductPageSkeleton() {
  return (
    <div className="container-brand py-8 animate-pulse">
      <div className="grid md:grid-cols-[55fr_45fr] gap-12">
        <div className="aspect-[3/4] bg-brand-gray" />
        <div className="space-y-4 pt-4">
          <div className="h-3 bg-brand-gray w-1/2" />
          <div className="h-8 bg-brand-gray w-3/4" />
          <div className="h-6 bg-brand-gray w-1/3" />
          <div className="h-24 bg-brand-gray" />
          <div className="h-12 bg-brand-gray" />
          <div className="h-12 bg-brand-gray" />
        </div>
      </div>
    </div>
  )
}
