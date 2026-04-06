import { useState, useRef, useEffect } from 'react'

const REVIEWS = [
  {
    id: 1,
    image: '/assets/images/review-product-1.jpg',
    text: '"La calidad es increíble. El vestido llegó exactamente como en las fotos, el tejido es hermoso."',
    author: 'Valentina M.',
    location: 'Bogotá',
    stars: 5,
  },
  {
    id: 2,
    image: '/assets/images/review-product-2.jpg',
    text: '"Compré una blusa y quedé enamorada. Ya hice mi segunda compra. El envío fue rapidísimo."',
    author: 'Daniela C.',
    location: 'Medellín',
    stars: 5,
  },
  {
    id: 3,
    image: '/assets/images/review-product-3.jpg',
    text: '"Finalmente una marca que entiende a la mujer colombiana. Los vestidos son espectaculares."',
    author: 'Laura G.',
    location: 'Cali',
    stars: 5,
  },
  {
    id: 4,
    image: '/assets/images/review-product-4.jpg',
    text: '"Me encanta la atención al cliente y la calidad de las prendas. 100% recomendado."',
    author: 'Mariana R.',
    location: 'Barranquilla',
    stars: 5,
  },
  {
    id: 5,
    image: '/assets/images/review-product-5.jpg',
    text: '"El pantalón wide leg es perfecto. La tela cae increíble y el ajuste es exactamente el que quería."',
    author: 'Sofía P.',
    location: 'Cartagena',
    stars: 5,
  },
]

function Stars({ count }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < count ? '#000' : '#E0E0E0'}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsCarousel() {
  const trackRef   = useRef(null)
  const [active, setActive] = useState(0)
  const total = REVIEWS.length

  function getVisibleCount() {
    if (typeof window === 'undefined') return 3
    if (window.innerWidth < 700) return 1
    if (window.innerWidth < 1000) return 2
    return 3
  }

  function scrollToIndex(i) {
    const track = trackRef.current
    if (!track) return
    const card = track.children[0]
    if (!card) return
    const gap = parseFloat(getComputedStyle(track).gap) || 24
    track.scrollTo({ left: i * (card.offsetWidth + gap), behavior: 'smooth' })
    setActive(i)
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = () => {
      const card = track.children[0]
      if (!card) return
      const gap = parseFloat(getComputedStyle(track).gap) || 24
      const idx = Math.round(track.scrollLeft / (card.offsetWidth + gap))
      setActive(idx)
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [])

  const maxIndex = Math.max(0, total - getVisibleCount())

  return (
    <section className="py-10 md:py-16 bg-brand-gray overflow-hidden">
      <div className="container-brand">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <p className="eyebrow mb-3" data-aos="fade-up">Reseñas</p>
            <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">Lo que dicen.</h2>
          </div>
          {/* Desktop arrows */}
          <div className="hidden md:flex gap-2" data-aos="fade-up" data-aos-delay="120">
            <button
              className="carousel-arrow"
              onClick={() => scrollToIndex(Math.max(0, active - 1))}
              disabled={active === 0}
              aria-label="Anterior"
            >
              ←
            </button>
            <button
              className="carousel-arrow"
              onClick={() => scrollToIndex(Math.min(maxIndex, active + 1))}
              disabled={active >= maxIndex}
              aria-label="Siguiente"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Track — full width with container padding */}
      <div className="container-brand">
        <div
          ref={trackRef}
          className="carousel-track"
          role="list"
        >
          {REVIEWS.map(r => (
            <article key={r.id} className="carousel-card" role="listitem">
              <div className="aspect-square overflow-hidden">
                <img
                  src={r.image}
                  alt={`Reseña de ${r.author}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-6">
                <Stars count={r.stars} />
                <p className="font-sans text-sm text-brand-black/70 leading-relaxed mb-4 italic">{r.text}</p>
                <cite className="not-italic">
                  <span className="font-sans text-[0.8125rem] font-semibold text-brand-black">{r.author}</span>
                  <span className="font-sans text-xs text-brand-black/40 ml-2">{r.location}</span>
                </cite>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Mobile arrows + Dots */}
      <div className="container-brand mt-6 flex flex-col items-center gap-4">
        <div className="flex md:hidden gap-3">
          <button className="carousel-arrow" onClick={() => scrollToIndex(Math.max(0, active - 1))} disabled={active === 0} aria-label="Anterior">←</button>
          <button className="carousel-arrow" onClick={() => scrollToIndex(Math.min(maxIndex, active + 1))} disabled={active >= maxIndex} aria-label="Siguiente">→</button>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === active ? 'carousel-dot--active' : ''}`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Ir a reseña ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
