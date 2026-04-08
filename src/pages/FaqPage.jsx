import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const FAQS = [
  {
    category: 'Envíos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    items: [
      {
        q: '¿Cuánto tarda mi pedido en llegar?',
        a: 'Nuestros pedidos se entregan en 3 a 5 días hábiles a cualquier ciudad de Colombia, una vez confirmado tu pago. Ciudades principales pueden recibir en 2–3 días hábiles.',
      },
      {
        q: '¿Hacen envíos a todo Colombia?',
        a: 'Sí, hacemos envíos a todo el territorio colombiano a través de Coordinadora. Si tu municipio está en una zona de difícil acceso, te contactaremos para coordinar.',
      },
      {
        q: '¿Cómo rasteo mi pedido?',
        a: 'Una vez despachado, recibirás un email con tu número de guía y el enlace directo para rastrearlo en la página de Coordinadora. También puedes consultar el estado en "Mis pedidos".',
      },
      {
        q: '¿Cuándo aplica el envío gratis?',
        a: 'El envío es gratis en todos los pedidos mayores a $200.000 COP. Para pedidos de menor valor, el costo de envío se calcula en el checkout según tu ciudad.',
      },
    ],
  },
  {
    category: 'Tallas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
    items: [
      {
        q: '¿Cómo sé qué talla pedir?',
        a: 'Consulta nuestra Guía de Tallas donde encontrarás una tabla completa con medidas en centímetros para busto, cintura, cadera y largo. Siempre recomendamos medir antes de pedir.',
        link: { label: 'Ver guía de tallas', to: '/guia-tallas' },
      },
      {
        q: '¿Qué significa "talla grande" en Bialy?',
        a: 'Nuestra línea Tallas Grandes incluye tallas L, XL y XXL, diseñadas específicamente para mujeres con curvas. Las medidas exactas están en nuestra guía de tallas.',
      },
      {
        q: '¿Puedo cambiar la talla si no me queda?',
        a: 'Sí. Tienes 30 días desde la recepción de tu pedido para solicitar un cambio de talla, siempre que la prenda esté sin uso, con etiquetas y en perfecto estado. Escríbenos a hola@bialycol.shop.',
      },
    ],
  },
  {
    category: 'Pagos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    items: [
      {
        q: '¿Qué métodos de pago aceptan?',
        a: 'Aceptamos todos los métodos disponibles en Wompi: tarjeta de crédito/débito (Visa, Mastercard, Amex), PSE, Nequi, Bancolombia, y pago en efectivo en puntos Efecty y Baloto.',
      },
      {
        q: '¿Es seguro pagar en Bialy?',
        a: 'Sí. Todos los pagos se procesan a través de Wompi, plataforma certificada por la Superintendencia Financiera de Colombia. Nunca almacenamos datos de tu tarjeta. La conexión está protegida con SSL.',
      },
      {
        q: '¿Aceptan pago contra entrega?',
        a: 'Por el momento no manejamos pago contra entrega. Todos los pedidos deben pagarse en el momento de la compra a través de Wompi.',
      },
    ],
  },
  {
    category: 'Devoluciones',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
      </svg>
    ),
    items: [
      {
        q: '¿Cuál es la política de cambios y devoluciones?',
        a: 'Aceptamos cambios y devoluciones dentro de los 30 días siguientes a la recepción del pedido, siempre que la prenda esté sin usar, sin lavar, con todas sus etiquetas originales y en su empaque.',
        link: { label: 'Ver política completa', to: '/terminos' },
      },
      {
        q: '¿Cómo inicio una devolución?',
        a: 'Escríbenos a hola@bialycol.shop con el asunto "Devolución – [número de pedido]". Te responderemos en menos de 24 horas con las instrucciones y la guía de envío prepagada.',
      },
    ],
  },
]

function AccordionItem({ question, answer, link, isOpen, onToggle }) {
  return (
    <div className="border-b border-brand-border last:border-b-0">
      <button
        type="button"
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-sans text-sm md:text-base font-medium text-brand-black leading-snug pr-2">
          {question}
        </span>
        <span
          className="shrink-0 mt-0.5 text-brand-black/40 transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? '400px' : '0px' }}
      >
        <div className="pb-5 pr-8">
          <p className="font-sans text-sm text-brand-black/65 leading-relaxed">{answer}</p>
          {link && (
            <Link to={link.to} className="inline-block mt-3 font-sans text-xs font-semibold uppercase tracking-button text-brand-black underline underline-offset-4 hover:opacity-70 transition-opacity">
              {link.label} →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FaqPage() {
  useEffect(() => { document.title = 'Preguntas Frecuentes — Bialy Colombia' }, [])
  const [open, setOpen] = useState({ '0-0': true })

  function toggle(key) {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="bg-brand-white min-h-screen">
      {/* Hero */}
      <section className="bg-brand-gray border-b border-brand-border">
        <div className="container-brand py-14 md:py-20 text-center">
          <p className="eyebrow mb-4" data-aos="fade-up">Ayuda</p>
          <h1 className="section-title max-w-xl mx-auto" data-aos="fade-up" data-aos-delay="60">
            Preguntas frecuentes
          </h1>
          <p className="font-sans text-brand-black/55 mt-4 max-w-md mx-auto leading-relaxed" data-aos="fade-up" data-aos-delay="120">
            Encuentra respuestas rápidas a las dudas más comunes. Si no encuentras lo que buscas, contáctanos.
          </p>
        </div>
      </section>

      {/* Categories + accordion */}
      <section className="container-brand py-12 md:py-16">
        <div className="max-w-2xl mx-auto space-y-10">
          {FAQS.map((section, si) => (
            <div key={section.category} data-aos="fade-up" data-aos-delay={si * 60}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-1">
                <span className="text-brand-black/40">{section.icon}</span>
                <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-black/40">
                  {section.category}
                </h2>
              </div>
              <div className="border-t border-brand-border">
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`
                  return (
                    <AccordionItem
                      key={key}
                      question={item.q}
                      answer={item.a}
                      link={item.link}
                      isOpen={!!open[key]}
                      onToggle={() => toggle(key)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-brand-border bg-brand-gray">
        <div className="container-brand py-14 text-center" data-aos="fade-up">
          <h2 className="font-sans text-lg font-semibold text-brand-black mb-2">
            ¿No encontraste tu respuesta?
          </h2>
          <p className="font-sans text-sm text-brand-black/55 mb-6">
            Nuestro equipo está listo para ayudarte de lunes a viernes, 9am – 6pm.
          </p>
          <Link to="/contacto" className="btn-primary">
            Contáctanos
          </Link>
        </div>
      </section>
    </div>
  )
}
