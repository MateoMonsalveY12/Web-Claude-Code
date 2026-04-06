import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="footer-contact" className="bg-brand-black text-brand-white">
      {/* Main footer */}
      <div className="container-brand py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <p className="font-sans text-base tracking-[0.18em] font-semibold uppercase mb-5">TU MARCA</p>
            <p className="font-sans text-sm text-white/55 leading-relaxed mb-5">
              Moda femenina colombiana con propósito. Prendas que abrazan tu historia.
            </p>
            <div className="flex gap-4">
              {['IG', 'FB', 'TK'].map(s => (
                <a key={s} href="#" className="font-sans text-xs font-semibold uppercase tracking-button text-white/40 hover:text-white transition-colors duration-200">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Colecciones */}
          <div>
            <p className="eyebrow text-white/40 mb-5">Colecciones</p>
            <ul className="space-y-3">
              {[
                { label: 'Nueva Colección', to: '/collections/nueva-coleccion' },
                { label: 'Vestidos',         to: '/collections/vestidos' },
                { label: 'Blusas',           to: '/collections/blusas' },
                { label: 'Jeans',            to: '/collections/jeans' },
                { label: 'Tallas Grandes',   to: '/collections/tallas-grandes' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="font-sans text-sm text-white/55 hover:text-white transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <p className="eyebrow text-white/40 mb-5">Ayuda</p>
            <ul className="space-y-3">
              {['Guía de tallas', 'Envíos y devoluciones', 'Preguntas frecuentes', 'Política de privacidad', 'Términos y condiciones'].map(l => (
                <li key={l}>
                  <a href="#" className="font-sans text-sm text-white/55 hover:text-white transition-colors duration-200">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="eyebrow text-white/40 mb-5">Newsletter</p>
            <p className="font-sans text-sm text-white/55 mb-4 leading-relaxed">
              Recibe las últimas tendencias y ofertas exclusivas.
            </p>
            <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="tu@correo.com"
                className="input-brand-dark"
                aria-label="Correo electrónico"
              />
              <button type="submit" className="btn-ghost border-white/30 text-white hover:bg-white hover:text-brand-black text-xs py-3">
                Suscribirme
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-brand py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-sans text-xs text-white/35">
            © 2026 Tu Marca. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-5">
            <p className="font-sans text-xs text-white/35">Hecho con amor en Colombia</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
