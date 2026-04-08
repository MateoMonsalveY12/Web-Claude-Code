import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const SIZES = [
  { size: 'XS',  busto: '80–83',  cintura: '60–63',  cadera: '87–90',  largo: '95–98' },
  { size: 'S',   busto: '84–87',  cintura: '64–67',  cadera: '91–94',  largo: '96–99' },
  { size: 'M',   busto: '88–92',  cintura: '68–72',  cadera: '95–99',  largo: '97–100' },
  { size: 'L',   busto: '93–97',  cintura: '73–77',  cadera: '100–104', largo: '98–101' },
  { size: 'XL',  busto: '98–103', cintura: '78–83',  cadera: '105–110', largo: '99–102' },
  { size: 'XXL', busto: '104–110', cintura: '84–90', cadera: '111–117', largo: '100–103' },
]

const TIPS = [
  {
    label: 'Busto',
    desc: 'Mide alrededor de la parte más ancha de tu busto, manteniendo la cinta horizontal.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
  {
    label: 'Cintura',
    desc: 'Mide en la parte más estrecha de tu torso, generalmente 2–3 cm sobre el ombligo.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
      </svg>
    ),
  },
  {
    label: 'Cadera',
    desc: 'Mide alrededor de la parte más ancha de tus caderas, aproximadamente 20 cm bajo la cintura.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      </svg>
    ),
  },
  {
    label: 'Largo',
    desc: 'Se mide desde el hombro hasta la rodilla (vestidos midi) o según el largo indicado en la ficha del producto.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="12" y1="2" x2="12" y2="22"/><polyline points="18 8 12 2 6 8"/><polyline points="6 16 12 22 18 16"/>
      </svg>
    ),
  },
]

export default function SizeGuidePage() {
  useEffect(() => { document.title = 'Guía de Tallas — Bialy Colombia' }, [])

  return (
    <div className="bg-brand-white min-h-screen">
      {/* Hero */}
      <section className="bg-brand-gray border-b border-brand-border -mt-24 md:-mt-28">
        <div className="container-brand pt-32 md:pt-40 pb-12 md:pb-18 text-center">
          <p className="eyebrow mb-4">Tallas</p>
          <h1 className="section-title max-w-xl mx-auto">Guía de tallas</h1>
          <p className="font-sans text-brand-black/55 mt-4 max-w-md mx-auto leading-relaxed">
            Encuentra tu talla perfecta. Todas las medidas están en centímetros (cm) y corresponden a tallas colombianas estándar.
          </p>
        </div>
      </section>

      <div className="container-brand py-12 md:py-16 max-w-3xl">

        {/* How to measure */}
        <section className="mb-12" data-aos="fade-up">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-black/40 mb-6">
            Cómo tomar tus medidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TIPS.map(tip => (
              <div key={tip.label} className="flex items-start gap-4 bg-brand-gray rounded-lg p-5 border border-brand-border">
                <span className="text-brand-black/40 shrink-0 mt-0.5">{tip.icon}</span>
                <div>
                  <p className="font-sans text-sm font-semibold text-brand-black mb-1">{tip.label}</p>
                  <p className="font-sans text-sm text-brand-black/55 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="font-sans text-xs text-brand-black/40 mt-4">
            Consejo: para mayor precisión usa una cinta métrica flexible. Si estás entre dos tallas, elige la más grande.
          </p>
        </section>

        {/* Size table */}
        <section data-aos="fade-up" data-aos-delay="60">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-black/40 mb-5">
            Tabla de medidas (en cm)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="bg-brand-black text-white">
                  {['Talla', 'Busto', 'Cintura', 'Cadera', 'Largo aprox.'].map(h => (
                    <th key={h} className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-left first:text-center">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZES.map((row, i) => (
                  <tr key={row.size} className={`border-t border-brand-border ${i % 2 === 0 ? 'bg-white' : 'bg-brand-gray'}`}>
                    <td className="px-4 py-3.5 font-sans text-sm font-bold text-brand-black text-center">
                      {row.size}
                    </td>
                    <td className="px-4 py-3.5 font-sans text-sm text-brand-black/70">{row.busto}</td>
                    <td className="px-4 py-3.5 font-sans text-sm text-brand-black/70">{row.cintura}</td>
                    <td className="px-4 py-3.5 font-sans text-sm text-brand-black/70">{row.cadera}</td>
                    <td className="px-4 py-3.5 font-sans text-sm text-brand-black/70">{row.largo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-sans text-xs text-brand-black/40 mt-3">
            * Las medidas son referenciales. Cada prenda puede tener ligeras variaciones según el modelo y el tejido.
          </p>
        </section>

        {/* Tips section */}
        <section className="mt-12 bg-brand-gray border border-brand-border rounded-xl p-6 md:p-8" data-aos="fade-up">
          <h2 className="font-sans text-sm font-semibold text-brand-black mb-4">Consejos para elegir tu talla</h2>
          <ul className="space-y-3">
            {[
              'Si tienes dudas entre dos tallas, escoge la mayor — siempre es más fácil ajustar.',
              'Para vestidos, prioriza la medida del busto o las caderas según tu cuerpo.',
              'Las prendas de telas elásticas (lycra, spandex) tienen más rango — tienden a quedar bien en 2 tallas.',
              'Para jeans y pantalones, la cintura es la medida más importante.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3 font-sans text-sm text-brand-black/65">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-brand-black/40">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center border-t border-brand-border pt-10" data-aos="fade-up">
          <p className="font-sans text-brand-black/55 mb-5">¿Todavía tienes dudas con tu talla?</p>
          <Link to="/contacto" className="btn-primary">
            Escríbenos
          </Link>
        </div>
      </div>
    </div>
  )
}
