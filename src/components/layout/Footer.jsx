import { Link } from 'react-router-dom'
import BialyLogo from '../shared/BialyLogo.jsx'

const TRUST_BADGES = [
  {
    title: 'Envío gratis',
    desc: 'Pedidos mayores a $200.000',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    title: 'Devolución fácil',
    desc: '30 días sin preguntas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
      </svg>
    ),
  },
  {
    title: 'Pago 100% seguro',
    desc: 'SSL encriptado',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    title: '+5.000 clientas',
    desc: 'Satisfechas en Colombia',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
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
                <span className="text-white/60 flex-shrink-0 mt-0.5">{b.icon}</span>
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
            <BialyLogo className="h-8 w-auto mb-5" />
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
              {[
                { label: 'Guía de tallas',           to: '/guia-tallas' },
                { label: 'Envíos y devoluciones',    to: '/terminos' },
                { label: 'Preguntas frecuentes',     to: '/faq' },
                { label: 'Política de privacidad',   to: '/privacidad' },
                { label: 'Términos y condiciones',   to: '/terminos' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="font-sans text-sm text-white/50 hover:text-white transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto + Newsletter */}
          <div>
            <p className="eyebrow text-white/35 mb-5">Contacto</p>
            <div className="space-y-3 mb-6">
              <a href="https://wa.me/573102232188" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-sans text-sm text-white/50 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                310 223 2188
              </a>
              <a href="mailto:hola@bialycol.shop" className="font-sans text-sm text-white/50 hover:text-white transition-colors block">
                hola@bialycol.shop
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
          <p className="font-sans text-xs text-white/30">© 2026 Bialy Colombia. Todos los derechos reservados.</p>
          <p className="font-sans text-xs text-white/30">Hecho con amor en Colombia 🇨🇴</p>
        </div>
      </div>
    </footer>
  )
}
