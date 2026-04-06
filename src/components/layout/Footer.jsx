import { Link } from 'react-router-dom'

const TRUST_BADGES = [
  { icon: '🚚', title: 'Envío gratis',      desc: 'Pedidos mayores a $200.000' },
  { icon: '↩',  title: 'Devolución fácil',  desc: '30 días sin preguntas' },
  { icon: '🔒', title: 'Pago 100% seguro',  desc: 'SSL encriptado' },
  { icon: '⭐', title: '+5.000 clientas',   desc: 'Satisfechas en Colombia' },
]

export default function Footer() {
  return (
    <footer id="footer-contact" className="bg-brand-black text-brand-white">

      {/* Trust badges strip */}
      <div className="border-b border-white/10">
        <div className="container-brand py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(b => (
              <div key={b.title} className="flex items-start gap-3">
                <span className="text-2xl leading-none">{b.icon}</span>
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-button text-white mb-0.5">{b.title}</p>
                  <p className="font-sans text-xs text-white/45">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="container-brand py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <p className="font-sans text-base tracking-[0.18em] font-semibold uppercase mb-5">TU MARCA</p>
            <p className="font-sans text-sm text-white/50 leading-relaxed mb-6">
              Moda femenina colombiana con propósito. Prendas diseñadas para mujeres que saben lo que quieren.
            </p>
            <div className="flex gap-4">
              {[
                { label: 'Instagram', href: 'https://instagram.com' },
                { label: 'Facebook',  href: 'https://facebook.com' },
                { label: 'TikTok',    href: 'https://tiktok.com' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="font-sans text-[0.625rem] font-semibold uppercase tracking-button text-white/35 hover:text-white transition-colors duration-200">
                  {s.label.slice(0, 2)}
                </a>
              ))}
            </div>
          </div>

          {/* Colecciones */}
          <div>
            <p className="eyebrow text-white/35 mb-5">Colecciones</p>
            <ul className="space-y-3">
              {[
                { label: 'Nueva Colección', to: '/collections/nueva-coleccion' },
                { label: 'Vestidos',         to: '/collections/vestidos' },
                { label: 'Blusas',           to: '/collections/blusas' },
                { label: 'Jeans',            to: '/collections/jeans' },
                { label: 'Tallas Grandes',   to: '/collections/tallas-grandes' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="font-sans text-sm text-white/50 hover:text-white transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <p className="eyebrow text-white/35 mb-5">Ayuda</p>
            <ul className="space-y-3">
              {['Guía de tallas', 'Envíos y devoluciones', 'Preguntas frecuentes', 'Política de privacidad', 'Términos y condiciones'].map(l => (
                <li key={l}>
                  <a href="#" className="font-sans text-sm text-white/50 hover:text-white transition-colors duration-200">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto + Newsletter */}
          <div>
            <p className="eyebrow text-white/35 mb-5">Contacto</p>
            <div className="space-y-3 mb-6">
              <a href="https://wa.me/573001234567" className="flex items-center gap-2 font-sans text-sm text-white/50 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                300 123 4567
              </a>
              <a href="mailto:hola@tumarca.com" className="font-sans text-sm text-white/50 hover:text-white transition-colors block">
                hola@tumarca.com
              </a>
            </div>

            <p className="eyebrow text-white/35 mb-3">Newsletter</p>
            <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-2">
              <input type="email" placeholder="tu@correo.com" className="input-brand-dark" aria-label="Email" />
              <button type="submit" className="btn-ghost border-white/25 text-white hover:bg-white hover:text-brand-black text-[0.75rem] py-3">
                Suscribirme
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-brand py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-sans text-xs text-white/30">© 2026 Tu Marca. Todos los derechos reservados.</p>
          <p className="font-sans text-xs text-white/30">Hecho con amor en Colombia 🇨🇴</p>
        </div>
      </div>
    </footer>
  )
}
