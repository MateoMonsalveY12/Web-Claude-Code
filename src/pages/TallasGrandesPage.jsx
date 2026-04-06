import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard.jsx'
import Breadcrumb from '../components/shared/Breadcrumb.jsx'

export default function TallasGrandesPage() {
  const { products, loading } = useProducts({ category: 'tallas-grandes' })

  return (
    <>
      {/* Hero — full-bleed, clears fixed header internally */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(420px, 60vw, 720px)', marginTop: 0 }}
      >
        <img
          src="/images/banner-tallas-grandes.jpg"
          alt="Tallas Grandes"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6" style={{ paddingTop: 'var(--header-h)' }}>
          <p className="eyebrow text-white/60 mb-4">Tallas S a 4XL</p>
          <h1
            className="font-display text-white tracking-heading mb-5"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 5rem)', lineHeight: 1.0 }}
          >
            Moda para todas<br />las mujeres.
          </h1>
          <p className="font-sans text-white/75 text-base md:text-lg max-w-xl leading-relaxed mb-8">
            Cada cuerpo merece sentirse extraordinario. Prendas diseñadas pensando en cada curva.
          </p>
          <a
            href="#tg-grid"
            className="btn-hero"
            onClick={e => { e.preventDefault(); document.getElementById('tg-grid')?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            Ver colección
          </a>
        </div>
      </div>

      <div className="container-brand">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Tallas Grandes' },
        ]} />
      </div>

      {/* Values strip */}
      <div className="bg-brand-gray py-8 md:py-10">
        <div className="container-brand">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { title: 'Tallas S – 4XL', desc: 'Ropa diseñada para todos los cuerpos, sin excepción' },
              { title: 'Tejidos Premium', desc: 'Materiales que abrazan, no comprimen. Comodidad real.' },
              { title: 'Diseño Inclusivo', desc: 'Patrones creados específicamente para curvas generosas' },
            ].map(v => (
              <div key={v.title} data-aos="fade-up">
                <p className="font-display text-xl md:text-2xl tracking-heading mb-2">{v.title}</p>
                <p className="font-sans text-sm text-brand-black/55 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <section id="tg-grid" className="py-12 md:py-16 bg-brand-white">
        <div className="container-brand">
          <div className="mb-8 md:mb-10">
            <p className="eyebrow mb-3" data-aos="fade-up">Colección</p>
            <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">Tallas Grandes</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} aosDelay={i * 60} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mid editorial banner */}
      <section className="py-12 md:py-16 bg-brand-black text-white">
        <div className="container-brand text-center">
          <p className="eyebrow text-white/40 mb-4" data-aos="fade-up">Nuestra promesa</p>
          <h2
            className="font-display text-white tracking-heading mb-6"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3.5rem)', lineHeight: 1.05 }}
            data-aos="fade-up"
            data-aos-delay="80"
          >
            "La talla no define<br />tu elegancia."
          </h2>
          <p
            className="font-sans text-white/55 max-w-xl mx-auto leading-relaxed mb-8"
            data-aos="fade-up"
            data-aos-delay="160"
          >
            Creemos que cada mujer merece acceso a moda de calidad, sin importar su talla. Por eso diseñamos cada prenda con el mismo cuidado y detalle para todas.
          </p>
          <Link to="/collections" className="btn-ghost border-white/30 text-white hover:bg-white hover:text-brand-black" data-aos="fade-up" data-aos-delay="240">
            Ver todas las colecciones
          </Link>
        </div>
      </section>
    </>
  )
}
