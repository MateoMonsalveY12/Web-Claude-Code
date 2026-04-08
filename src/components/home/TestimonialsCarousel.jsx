import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'

const FALLBACK_REVIEWS = [
  {
    id: 1,
    image: '/images/review-product-1.jpg',
    text: '"La calidad es increíble. El vestido llegó exactamente como en las fotos, el tejido es hermoso."',
    author: 'Valentina M.',
    location: 'Bogotá',
    stars: 5,
  },
  {
    id: 2,
    image: '/images/review-product-2.jpg',
    text: '"Compré una blusa y quedé enamorada. Ya hice mi segunda compra. El envío fue rapidísimo."',
    author: 'Daniela C.',
    location: 'Medellín',
    stars: 5,
  },
  {
    id: 3,
    image: '/images/review-product-3.jpg',
    text: '"Finalmente una marca que entiende a la mujer colombiana. Los vestidos son espectaculares."',
    author: 'Laura G.',
    location: 'Cali',
    stars: 5,
  },
  {
    id: 4,
    image: '/images/review-product-4.jpg',
    text: '"Me encanta la atención al cliente y la calidad de las prendas. 100% recomendado."',
    author: 'Mariana R.',
    location: 'Barranquilla',
    stars: 5,
  },
  {
    id: 5,
    image: '/images/review-product-5.jpg',
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

function InitialAvatar({ name }) {
  const letter = (name || 'A').charAt(0).toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-brand-black text-white flex items-center justify-center shrink-0">
      <span className="font-sans text-sm font-semibold">{letter}</span>
    </div>
  )
}

export default function TestimonialsCarousel() {
  const trackRef   = useRef(null)
  const [active, setActive] = useState(0)
  const [reviews, setReviews] = useState(null) // null = loading

  // Fetch reviews from DB
  useEffect(() => {
    if (!supabase) { setReviews([]); return }
    supabase
      .from('reviews')
      .select('id, rating, comment, photo_url, customer_name, product_name, created_at')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setReviews(data ?? [])
      })
      .catch(() => setReviews([]))
  }, [])

  // Decide which data to show
  const displayReviews = (reviews && reviews.length > 0)
    ? reviews.map(r => ({
        id: r.id,
        image: r.photo_url || null,
        text: `"${r.comment}"`,
        author: r.customer_name || 'Cliente Bialy',
        location: r.product_name || '',
        stars: r.rating,
        fromDB: true,
      }))
    : FALLBACK_REVIEWS

  const total = displayReviews.length

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

  if (reviews === null) {
    // Still loading — show skeleton
    return (
      <section className="py-10 md:py-16 bg-brand-gray overflow-hidden">
        <div className="container-brand">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow mb-3">Reseñas</p>
              <h2 className="section-title">Lo que dicen.</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white p-6 space-y-3">
                <div className="aspect-square bg-brand-border/40" />
                <div className="h-3 bg-brand-border/40 rounded w-3/4" />
                <div className="h-3 bg-brand-border/40 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

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

      {/* Track */}
      <div className="container-brand">
        <div ref={trackRef} className="carousel-track" role="list">
          {displayReviews.map(r => (
            <article key={r.id} className="carousel-card" role="listitem">
              {/* Photo or avatar */}
              {r.image ? (
                <div className="aspect-square overflow-hidden">
                  <img
                    src={r.image}
                    alt={`Reseña de ${r.author}`}
                    loading="lazy"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-brand-border/20 flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-black/20">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
              <div className="p-6">
                <Stars count={r.stars} />
                <p className="font-sans text-sm text-brand-black/70 leading-relaxed mb-4 italic">{r.text}</p>
                <div className="flex items-center gap-3">
                  {r.fromDB && <InitialAvatar name={r.author} />}
                  <cite className="not-italic">
                    <span className="font-sans text-[0.8125rem] font-semibold text-brand-black">{r.author}</span>
                    {r.location && (
                      <span className="font-sans text-xs text-brand-black/40 ml-2">{r.location}</span>
                    )}
                  </cite>
                </div>
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
