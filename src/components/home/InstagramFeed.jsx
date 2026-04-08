const PROFILE_URL = 'https://www.instagram.com/bialyoficial/'

const POSTS = [
  {
    src:     '/images/instagram-1.jpg',
    caption: 'Nuestra nueva colección de vestidos para esta temporada. Diseñados para la mujer que sabe lo que quiere. ✨',
  },
  {
    src:     '/images/instagram-2.jpg',
    caption: 'Jeans de tiro alto + blusa blanca = el outfit perfecto para cualquier ocasión. 🤍',
  },
  {
    src:     '/images/instagram-3.jpg',
    caption: 'Los detalles hacen la diferencia. Cada prenda Bialy es pensada con amor. 🌿',
  },
  {
    src:     '/images/instagram-4.jpg',
    caption: 'Colores que enamoran. Nuestra blusa en terracota ya está disponible en la tienda. 🧡',
  },
  {
    src:     '/images/instagram-5.jpg',
    caption: 'Los accesorios que complementan tu look Bialy. Porque los detalles importan.',
  },
  {
    src:     '/images/instagram-6.jpg',
    caption: 'Vestido wrap en tonos cálidos — uno de nuestros favoritos de la temporada. 🍂',
  },
  {
    src:     '/images/instagram-7.jpg',
    caption: 'Moda que une. Looks coordinados para tú y tu mejor amiga. 💚',
  },
  {
    src:     '/images/instagram-8.jpg',
    caption: 'Artesanía colombiana en cada puntada. Nuestros bordados a mano son únicos. 🇨🇴',
  },
  {
    src:     '/images/instagram-9.jpg',
    caption: 'El negro nunca falla. Vestido midi ajustado — elegancia sin esfuerzo. 🖤',
  },
]

/* ── Instagram icon SVG ──────────────────────────────────────────── */
function IgIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export default function InstagramFeed() {
  return (
    <section className="py-16 md:py-24 bg-brand-white">
      <div className="container-brand">

        {/* Section header */}
        <div className="text-center mb-8 md:mb-10">
          <p className="eyebrow mb-3" data-aos="fade-up">Instagram</p>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">
            @bialyoficial
          </h2>
          <p
            className="font-sans text-sm text-brand-muted mt-3 max-w-xs mx-auto"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Síguenos para ver lo último en moda femenina colombiana
          </p>
        </div>

        {/* 3×3 grid */}
        <div
          className="grid grid-cols-3 gap-1.5 md:gap-2"
          data-aos="fade-up"
          data-aos-delay="140"
        >
          {POSTS.map((post, i) => (
            <a
              key={i}
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden bg-brand-gray"
              aria-label={`Ver @bialyoficial en Instagram — ${post.caption.slice(0, 40)}…`}
            >
              {/* Photo */}
              <img
                src={post.src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-brand-black/0 group-hover:bg-brand-black/55 transition-all duration-300 ease-out flex flex-col items-center justify-center gap-2.5 p-3">
                {/* IG icon */}
                <span className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 translate-y-2 group-hover:translate-y-0">
                  <IgIcon />
                </span>
                {/* Caption */}
                <p className="font-sans text-white text-[0.65rem] sm:text-xs leading-snug text-center line-clamp-3 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 translate-y-2 group-hover:translate-y-0 px-1">
                  {post.caption}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 md:mt-10" data-aos="fade-up" data-aos-delay="180">
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost inline-flex items-center gap-2.5"
          >
            <IgIcon />
            <span>Ver perfil completo</span>
          </a>
        </div>

      </div>
    </section>
  )
}
