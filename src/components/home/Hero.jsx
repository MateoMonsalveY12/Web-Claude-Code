import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const SLIDES = [
  { id: 'slide-1', src: '/assets/images/hero-bg-1.jpg', kenBurns: 'hero-ken-burns-a', origin: '55% 50%' },
  { id: 'slide-2', src: '/assets/images/hero-bg-2.jpg', kenBurns: 'hero-ken-burns-b', origin: '45% 55%' },
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
    <section
      className="relative w-full flex items-center justify-start overflow-hidden"
      style={{ height: '100svh' }}
      aria-label="Hero"
    >
      {/* Slides */}
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none" aria-hidden="true" />

      {/* Content */}
      <div className="container-brand relative z-10 pt-20">
        <p className="eyebrow text-white/60 mb-4" data-aos="fade-up">Nueva Colección 2026</p>
        <h1
          className="font-display text-white mb-6"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)', lineHeight: 1.0, letterSpacing: '0.02em' }}
          data-aos="fade-up"
          data-aos-delay="80"
        >
          Moda que<br />te define.
        </h1>
        <p
          className="font-sans text-white/75 text-base md:text-lg mb-10 max-w-md leading-relaxed"
          data-aos="fade-up"
          data-aos-delay="160"
        >
          Prendas colombianas diseñadas para mujeres que saben lo que quieren.
        </p>
        <div className="flex flex-wrap gap-4" data-aos="fade-up" data-aos-delay="240">
          <Link to="/collections/nueva-coleccion" className="btn-hero">
            Ver Colección
          </Link>
          <Link to="/collections/vestidos" className="btn-ghost border-white text-white hover:bg-white hover:text-brand-black">
            Vestidos
          </Link>
        </div>
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
