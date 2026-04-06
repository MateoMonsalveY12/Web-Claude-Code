import { Link } from 'react-router-dom'

export default function EditorialSplit() {
  return (
    <section className="bg-brand-white overflow-hidden">
      <div className="editorial-split-grid">
        {/* Images */}
        <div className="editorial-images-wrapper" data-aos="fade-right">
          <div className="editorial-img-main-wrap">
            <img
              src="/images/editorial-main.jpg"
              alt="Colección vestidos"
              loading="lazy"
            />
          </div>
          <div className="editorial-img-accent-wrap" data-aos="zoom-in" data-aos-delay="350">
            <img
              src="/images/editorial-accent.jpg"
              alt="Detalle editorial"
              loading="lazy"
            />
          </div>
        </div>

        {/* Text */}
        <div className="editorial-text-side" data-aos="fade-left" data-aos-delay="150">
          <p className="eyebrow mb-4">Vestidos</p>
          <h2 className="font-display editorial-title mb-6">
            Un vestido es siempre<br />la mejor elección.
          </h2>
          <p className="font-sans text-brand-black/60 leading-relaxed mb-4">
            Siluetas que abrazan tu feminidad. Desde el casual cotidiano hasta el momento especial que merece ser recordado.
          </p>
          <p className="font-sans text-brand-black/60 leading-relaxed mb-8">
            Cada pieza está diseñada pensando en la mujer colombiana — su cuerpo, su ritmo, su luz.
          </p>
          <Link to="/collections/vestidos" className="editorial-cta-link">
            Comprar Vestidos →
          </Link>
        </div>
      </div>
    </section>
  )
}
