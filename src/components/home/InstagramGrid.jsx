const POSTS = [
  '/images/instagram-1.jpg',
  '/images/instagram-2.jpg',
  '/images/instagram-3.jpg',
  '/images/instagram-4.jpg',
  '/images/instagram-5.jpg',
  '/images/instagram-6.jpg',
]

export default function InstagramGrid() {
  return (
    <section className="py-10 md:py-16 bg-brand-white">
      <div className="container-brand">
        <div className="text-center mb-8 md:mb-10">
          <p className="eyebrow mb-3" data-aos="fade-up">Instagram</p>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">@TuMarca</h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3" data-aos="fade-up" data-aos-delay="120">
          {POSTS.map((src, i) => (
            <a
              key={i}
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group block aspect-square overflow-hidden"
              aria-label={`Ver post ${i + 1} en Instagram`}
            >
              <img
                src={src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
