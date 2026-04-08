import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  useEffect(() => { document.title = '404 — Bialy Colombia' }, [])

  return (
    <div className="min-h-screen bg-brand-white flex flex-col items-center justify-center px-6 py-20 text-center">

      {/* Illustration — empty clothes rack SVG */}
      <div className="mb-8 text-brand-black/15" aria-hidden="true">
        <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Horizontal rail */}
          <line x1="10" y1="28" x2="150" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Center support */}
          <line x1="80" y1="0" x2="80" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          {/* Hanger 1 */}
          <path d="M38 28 Q38 40 50 46 Q62 52 62 28" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round"/>
          <line x1="50" y1="22" x2="50" y2="28" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          <circle cx="50" cy="21" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          {/* Hanger 2 */}
          <path d="M68 28 Q68 40 80 46 Q92 52 92 28" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round"/>
          <line x1="80" y1="22" x2="80" y2="28" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          <circle cx="80" cy="21" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          {/* Hanger 3 */}
          <path d="M98 28 Q98 40 110 46 Q122 52 122 28" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round"/>
          <line x1="110" y1="22" x2="110" y2="28" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          <circle cx="110" cy="21" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          {/* Floor shadow */}
          <ellipse cx="80" cy="118" rx="60" ry="4" fill="currentColor" opacity="0.4"/>
          {/* Legs */}
          <line x1="20" y1="28" x2="20" y2="115" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="140" y1="28" x2="140" y2="115" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* 404 number */}
      <p
        className="font-display text-brand-black/8 select-none"
        style={{ fontSize: 'clamp(6rem, 20vw, 12rem)', lineHeight: 0.85, letterSpacing: '-0.02em' }}
        aria-hidden="true"
      >
        404
      </p>

      {/* Text */}
      <h1 className="font-display text-brand-black mt-4 mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
        Esta prenda ya voló del armario 👗
      </h1>
      <p className="font-sans text-brand-black/55 text-base md:text-lg mb-10 max-w-sm leading-relaxed">
        La página que buscas no existe o fue movida a otra parte.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
        <Link to="/collections/vestidos" className="btn-ghost">
          Ver colecciones
        </Link>
      </div>
    </div>
  )
}
