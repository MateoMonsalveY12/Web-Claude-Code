const PROFILE_URL = 'https://www.instagram.com/bialyoficial/'

// 6 fotos — 1 fila horizontal
// Desktop: 6 cols · Tablet: 4 cols · Mobile: 3 cols
const POSTS = [
  {
    src:     '/images/instagram-1.jpg',
    caption: 'Vestido negro con vuelo — el básico que nunca falla. ¿Cuál es tu talla? ✨',
  },
  {
    src:     '/images/instagram-2.jpg',
    caption: 'Estilo urbano con actitud. Camisa blanca Bialy + look casual que conquista. 🤍',
  },
  {
    src:     '/images/instagram-3.jpg',
    caption: 'Vestido blanco de noche romántica. Perfecto para cada momento especial. 🌸',
  },
  {
    src:     '/images/instagram-4.jpg',
    caption: 'Azul cielo + cinturón madera = outfit de verano soñado. Nueva colección. 💙',
  },
  {
    src:     '/images/instagram-5.jpg',
    caption: 'Vestido off-shoulder malva — feminidad y comodidad en un solo look. 🌷',
  },
  {
    src:     '/images/instagram-6.jpg',
    caption: 'Sonríe — llevas Bialy. Vestido babydoll rosa para tu día más especial. 🎀',
  },
]

function IgIcon({ size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="eyebrow mb-3" data-aos="fade-up">Instagram</p>
            <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">
              @bialyoficial
            </h2>
          </div>
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost btn-sm self-start sm:self-auto inline-flex items-center gap-2"
            data-aos="fade-up"
            data-aos-delay="120"
          >
            <IgIcon size={14} />
            <span>Ver perfil</span>
          </a>
        </div>

        {/* Single-row horizontal grid
            Desktop  → 6 cols (grid-cols-6)
            Tablet   → 4 cols (grid-cols-4)
            Mobile   → 3 cols (grid-cols-3) */}
        <div
          className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 md:gap-2"
          data-aos="fade-up"
          data-aos-delay="140"
        >
          {POSTS.map((post, i) => (
            <a
              key={i}
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden bg-brand-gray"
              style={{ aspectRatio: '1 / 1', maxHeight: '180px' }}
              aria-label={`Ver @bialyoficial en Instagram`}
            >
              <img
                src={post.src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-brand-black/0 group-hover:bg-brand-black/55 transition-all duration-300 ease-out flex flex-col items-center justify-center gap-2 p-2">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-all duration-200 delay-50 translate-y-1.5 group-hover:translate-y-0">
                  <IgIcon size={20} />
                </span>
                <p className="font-sans text-white text-[0.6rem] leading-snug text-center line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 translate-y-1.5 group-hover:translate-y-0 hidden sm:block">
                  {post.caption}
                </p>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}
