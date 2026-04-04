import AOS from 'aos'
import 'aos/dist/aos.css'
import '../css/main.css'

import { initAnnouncementBar } from './announcement-bar.js'
import { initNav }             from './nav.js'
import { initHero }            from './hero.js'
import { initMegamenu }        from './megamenu.js'
import { initReviewsCarousel } from './carousel.js'

// ── AOS (Animate On Scroll) ────────────────────────────────────────
AOS.init({
  duration: 750,
  easing:   'ease-out-quad',
  once:     true,
  offset:   40,
  delay:    0,
  // Disable entirely if user prefers reduced motion
  disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
})

// ── Module inits ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAnnouncementBar()
  initNav()
  initHero()
  initMegamenu()
  initReviewsCarousel()
})
