/**
 * Hero module
 * ─ Crossfades between 2 Ken-Burns image slides every 7 seconds
 * ─ Scroll-down button triggers smooth scroll to #collections
 */
export function initHero() {

  // ── Slide crossfade ──────────────────────────────────────────────
  const s1 = document.getElementById('hero-slide-1')
  const s2 = document.getElementById('hero-slide-2')

  if (s1 && s2) {
    const slides = [s1, s2]
    let active = 0

    setInterval(() => {
      const next = (active + 1) % slides.length
      slides[next].classList.add('hero-slide--active')
      slides[active].classList.remove('hero-slide--active')
      active = next
    }, 7000)
  }

  // ── Scroll indicator ─────────────────────────────────────────────
  const btn         = document.getElementById('scroll-down')
  const nextSection = document.getElementById('collections')

  if (btn && nextSection) {
    btn.addEventListener('click', () => {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    })
  }
}
