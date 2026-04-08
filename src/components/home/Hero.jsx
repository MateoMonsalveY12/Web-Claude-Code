import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const SLIDES = [
  { id: 'slide-1', src: '/images/hero-bialy-1.jpg', kenBurns: 'hero-ken-burns-a', origin: '55% 50%' },
  { id: 'slide-2', src: '/images/hero-bialy-2.jpg', kenBurns: 'hero-ken-burns-b', origin: '45% 55%' },
]

export default function Hero() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(a => (a + 1) % SLIDES.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  return (
    // height: 100svh → exactly the viewport. Starts at position 0 in the
    // document (main has no padding-top on home). The fixed header stack
    // (AnnouncementBar + Navbar ≈ 96–112px) overlays the top of the image.
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100svh' }}
      aria-label="Hero principal"
    >
      {/* ── Background slides ─────────────────────────────────── */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className="hero-slide absolute inset-0 overflow-hidden"
          style={{ opacity: active === i ? 1 : 0 }}
        >
          <img
            src={slide.src}
            alt=""
            aria-hidden="true"
            className="hero-slide-img w-full h-full object-cover object-center"
            style={{ transformOrigin: slide.origin, animationName: slide.kenBurns }}
          />
        </div>
      ))}

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" aria-hidden="true" />

      {/* ── Content — LEFT aligned, offset for fixed header ────── */}
      {/* pt-24 md:pt-28 clears the fixed announcement bar + navbar  */}
      <div className="absolute inset-0 flex items-center">
        <div className="container-brand w-full pt-24 md:pt-28">
          <p
            className="eyebrow text-white/65 mb-4"
            data-aos="fade-up"
          >
            Nueva Colección 2026
          </p>

          <h1
            className="font-display text-white text-left"
            style={{ fontSize: 'clamp(2.75rem, 7vw, 6.5rem)', lineHeight: 1.0, letterSpacing: '0.02em', maxWidth: '14ch' }}
            data-aos="fade-up"
            data-aos-delay="80"
          >
            Moda que<br />te define.
          </h1>

          <p
            className="font-sans text-white/75 text-base md:text-lg mt-6 mb-10 leading-relaxed text-left"
            style={{ maxWidth: '38ch' }}
            data-aos="fade-up"
            data-aos-delay="160"
          >
            Prendas colombianas diseñadas para mujeres que saben lo que quieren.
          </p>

          <div className="flex flex-wrap gap-4 justify-start" data-aos="fade-up" data-aos-delay="240">
            <Link to="/collections/nueva-coleccion" className="btn-hero">
              Ver Colección
            </Link>
            <Link
              to="/collections/vestidos"
              className="btn-ghost border-white/60 text-white hover:bg-white hover:text-brand-black"
            >
              Vestidos
            </Link>
          </div>

        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="carousel-dot"
            style={{ opacity: i === active ? 1 : 0.3, width: i === active ? '24px' : '6px' }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <button
        className="scroll-indicator"
        aria-label="Ir a colecciones"
        onClick={() => document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span className="font-sans text-[0.6875rem] uppercase tracking-button">Scroll</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="19 12 12 19 5 12"/>
        </svg>
      </button>
    </section>
  )
}
