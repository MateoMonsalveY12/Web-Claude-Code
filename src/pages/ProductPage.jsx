import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProduct } from '../hooks/useProduct.js'
import { useProducts } from '../hooks/useProducts.js'
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard.jsx'
import Breadcrumb from '../components/shared/Breadcrumb.jsx'

function formatPrice(n) {
  return '$' + n.toLocaleString('es-CO')
}

const ACCORDION_ITEMS = [
  {
    id: 'desc',
    title: 'Descripción',
    content: null, // filled from product.description
  },
  {
    id: 'size',
    title: 'Guía de tallas',
    content: 'XS: talla 6 / S: talla 8 / M: talla 10 / L: talla 12 / XL: talla 14. Si estás entre dos tallas, te recomendamos elegir la talla más grande para mayor comodidad.',
  },
  {
    id: 'material',
    title: 'Materiales y cuidados',
    content: 'Lavar a mano o en ciclo delicado. No usar blanqueador. Planchar a temperatura baja. Ver etiqueta interior para instrucciones específicas de cada prenda.',
  },
  {
    id: 'shipping',
    title: 'Envíos y devoluciones',
    content: 'Envío estándar 3-5 días hábiles. Envío express 1-2 días hábiles. Envío gratis en pedidos mayores a $200.000. Devoluciones gratuitas en 30 días sin preguntas.',
  },
]

export default function ProductPage() {
  const { slug } = useParams()
  const { product, loading, error } = useProduct(slug)
  const [activeImg, setActiveImg]   = useState(0)
  const [selectedSize, setSize]     = useState(null)
  const [selectedColor, setColor]   = useState(null)
  const [openAccordion, setAccordion] = useState('desc')
  const [added, setAdded] = useState(false)

  const { products: related } = useProducts({
    category: product?.category,
    limit: 4,
  })

  if (loading) return <ProductPageSkeleton />
  if (error || !product) return (
    <div className="container-brand py-24 text-center">
      <p className="font-sans text-sm text-brand-black/40 mb-4">Producto no encontrado.</p>
      <Link to="/collections" className="btn-primary">Ver colecciones</Link>
    </div>
  )

  const { name, price, compare_price, images, sizes, colors, badge, category, description } = product
  const discount = compare_price ? Math.round((1 - price / compare_price) * 100) : null

  function handleAddToCart() {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const accordionItems = ACCORDION_ITEMS.map(a => ({
    ...a,
    content: a.id === 'desc' ? description : a.content,
  }))

  return (
    <>
      <div className="container-brand pt-6 pb-2">
        <Breadcrumb items={[
          { label: 'Inicio',                href: '/' },
          { label: category,                href: `/collections/${category}` },
          { label: name.slice(0, 40) + (name.length > 40 ? '…' : '') },
        ]} />
      </div>

      <div className="container-brand pb-16">
        <div className="grid md:grid-cols-[55fr_45fr] gap-8 md:gap-12">

          {/* ── Gallery ─────────────────────────────────────── */}
          <div>
            {/* Main image */}
            <div className="overflow-hidden aspect-[3/4] bg-brand-gray mb-3">
              <img
                src={images[activeImg] || images[0]}
                alt={name}
                className="w-full h-full object-cover object-top transition-opacity duration-300"
                key={activeImg}
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 aspect-square overflow-hidden border-2 transition-all duration-200 ${i === activeImg ? 'border-brand-black' : 'border-transparent hover:border-brand-border'}`}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ─────────────────────────────────── */}
          <div className="md:sticky md:top-24 self-start">
            {badge && (
              <span className={`inline-block mb-3 text-[0.625rem] font-sans font-semibold uppercase tracking-button px-2.5 py-1 ${badge.startsWith('REBAJAS') ? 'bg-brand-red text-white' : 'bg-brand-black text-white'}`}>
                {badge}
              </span>
            )}

            <h1
              className="font-display text-brand-black mb-4 tracking-heading"
              style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', lineHeight: 1.1 }}
            >
              {name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-sans text-xl font-semibold text-brand-black">{formatPrice(price)}</span>
              {compare_price && (
                <>
                  <span className="font-sans text-sm text-brand-black/40 line-through">{formatPrice(compare_price)}</span>
                  <span className="font-sans text-xs font-semibold text-brand-red">-{discount}%</span>
                </>
              )}
            </div>

            {/* Colors */}
            {colors?.length > 0 && (
              <div className="mb-5">
                <p className="font-sans text-xs font-semibold uppercase tracking-button text-brand-black/50 mb-2.5">Color</p>
                <div className="flex gap-2">
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
                  <p className="font-sans text-xs font-semibold uppercase tracking-button text-brand-black/50">Talla</p>
                  <button className="font-sans text-xs text-brand-black/40 underline underline-offset-2 hover:text-brand-black transition-colors">
                    Guía de tallas
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`font-sans text-xs px-4 py-2.5 border transition-all duration-150 min-w-[3rem] ${selectedSize === s ? 'bg-brand-black text-white border-brand-black' : 'border-brand-border text-brand-black hover:border-brand-black'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                className={`btn-primary w-full text-center transition-all duration-300 ${added ? 'bg-green-700 border-green-700' : ''}`}
              >
                {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
              </button>
              <button className="btn-ghost w-full text-center">
                Comprar ahora
              </button>
            </div>

            {/* Accordion */}
            <div className="border-t border-brand-border">
              {accordionItems.map(item => (
                <div key={item.id} className="border-b border-brand-border">
                  <button
                    className="flex items-center justify-between w-full py-4 font-sans text-sm font-semibold text-brand-black text-left"
                    onClick={() => setAccordion(openAccordion === item.id ? null : item.id)}
                    aria-expanded={openAccordion === item.id}
                  >
                    {item.title}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      style={{ transform: openAccordion === item.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms', flexShrink: 0 }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <div style={{
                    maxHeight: openAccordion === item.id ? '400px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 300ms ease-out',
                  }}>
                    <p className="font-sans text-sm text-brand-black/60 leading-relaxed pb-5">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Related products ─────────────────────────────── */}
        {related.filter(p => p.slug !== slug).length > 0 && (
          <div className="mt-16 md:mt-20">
            <div className="border-t border-brand-border pt-12 mb-8">
              <p className="eyebrow mb-3">También te puede gustar</p>
              <h2 className="font-display text-2xl md:text-3xl tracking-heading">Más de {category}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {related
                .filter(p => p.slug !== slug)
                .slice(0, 4)
                .map((p, i) => (
                  <ProductCard key={p.id} product={p} aosDelay={i * 60} />
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function ProductPageSkeleton() {
  return (
    <div className="container-brand py-8 animate-pulse">
      <div className="grid md:grid-cols-[55fr_45fr] gap-12">
        <div className="aspect-[3/4] bg-brand-gray" />
        <div className="space-y-4 pt-4">
          <div className="h-4 bg-brand-gray w-1/2" />
          <div className="h-8 bg-brand-gray w-3/4" />
          <div className="h-6 bg-brand-gray w-1/3" />
          <div className="h-32 bg-brand-gray" />
          <div className="h-12 bg-brand-gray" />
        </div>
      </div>
    </div>
  )
}
