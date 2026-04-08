import { Link } from 'react-router-dom'

const COLLECTIONS = [
  {
    title: 'Vestidos',
    subtitle: 'Para cada ocasión',
    href: '/collections/vestidos',
    image: '/images/estilo-casual.jpg',
  },
  {
    title: 'Blusas',
    subtitle: 'Elegancia versátil',
    href: '/collections/blusas',
    image: '/images/estilo-elegante.jpg',
  },
  {
    title: 'Tallas Grandes',
    subtitle: 'Moda para todas',
    href: '/collections/tallas-grandes',
    image: '/images/estilo-romantico.jpg',
  },
]

export default function FeaturedCollections() {
  return (
    <section id="collections" className="py-10 md:py-16 bg-brand-white">
      <div className="container-brand">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="eyebrow mb-3" data-aos="fade-up">Colecciones</p>
            <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">
              Encuentra tu estilo.
            </h2>
          </div>
          <Link
            to="/collections"
            className="btn-ghost btn-sm self-start sm:self-auto"
            data-aos="fade-up"
            data-aos-delay="120"
          >
            Ver todo
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          {COLLECTIONS.map((col, i) => (
            <Link
              key={col.title}
              to={col.href}
              className="group block relative overflow-hidden"
              data-aos="zoom-in"
              data-aos-delay={i * 80}
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={col.image}
                  alt={col.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="eyebrow text-white/60 mb-1">{col.subtitle}</p>
                <h3 className="font-display text-white text-2xl md:text-3xl tracking-heading">
                  {col.title}
                </h3>
                <span className="inline-block mt-3 font-sans text-xs font-semibold uppercase tracking-button text-white underline underline-offset-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Explorar →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
