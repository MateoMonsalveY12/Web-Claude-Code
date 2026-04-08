import { Link } from 'react-router-dom'
import { useHomeSections } from '../../hooks/useHomeSections.js'

export default function PromoEditorial() {
  const { sections } = useHomeSections()

  return (
    <section className="bg-brand-gray overflow-hidden" aria-labelledby="promo-title">
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* Imagen */}
        <div
          className="relative overflow-hidden"
          style={{ minHeight: '420px' }}
          data-aos="fade-right"
          data-aos-duration="900"
        >
          <img
            src={sections.detalle_tela}
            alt="Colección especial"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>

        {/* Texto */}
        <div
          className="flex flex-col justify-center px-6 md:px-12 lg:px-16 py-14 md:py-20"
          data-aos="fade-left"
          data-aos-delay="150"
          data-aos-duration="900"
        >
          <span className="badge-promo mb-6 self-start">Edición Limitada</span>

          <h2 id="promo-title" className="section-title mb-5 max-w-sm">
            Diseñada para<br />brillar.
          </h2>

          <p className="text-brand-black/65 leading-relaxed mb-8 max-w-sm text-[0.9375rem]">
            Nuestra colección editorial combina tejidos premium con siluetas que realzan tu figura. Cada pieza, una declaración.
          </p>

          <Link to="/collections/vestidos" className="btn-primary self-start">
            Ver Colección
          </Link>
        </div>

      </div>
    </section>
  )
}
