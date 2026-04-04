/**
 * Reviews carousel — CSS scroll-snap + JS navigation + dots
 */
export function initReviewsCarousel() {
  const track = document.getElementById('reviews-track')
  if (!track) return

  const prevBtns = Array.from(document.querySelectorAll('.reviews-prev'))
  const nextBtns = Array.from(document.querySelectorAll('.reviews-next'))
  const dotsWrap = document.getElementById('reviews-dots')
  const cards    = Array.from(track.querySelectorAll('.carousel-card'))
  const total    = cards.length

  // Build dots dynamically
  if (dotsWrap) {
    cards.forEach((_, i) => {
      const dot = document.createElement('button')
      dot.className = 'carousel-dot' + (i === 0 ? ' carousel-dot--active' : '')
      dot.setAttribute('aria-label', `Testimonio ${i + 1}`)
      dot.addEventListener('click', () => scrollToIndex(i))
      dotsWrap.appendChild(dot)
    })
  }

  function getVisibleCount() {
    const w = window.innerWidth
    if (w >= 1000) return 3
    if (w >= 700)  return 2
    return 1
  }

  function getCardStep() {
    if (!cards[0]) return 0
    const gap = parseFloat(getComputedStyle(track).gap) || 0
    return cards[0].offsetWidth + gap
  }

  function getActiveIndex() {
    const step = getCardStep()
    return step > 0 ? Math.round(track.scrollLeft / step) : 0
  }

  function scrollToIndex(i) {
    track.scrollTo({ left: i * getCardStep(), behavior: 'smooth' })
  }

  function updateUI() {
    const i = getActiveIndex()
    // Dots
    dotsWrap?.querySelectorAll('.carousel-dot').forEach((dot, j) => {
      dot.classList.toggle('carousel-dot--active', j === i)
    })
    // Arrows
    prevBtns.forEach(btn => { btn.disabled = i === 0 })
    nextBtns.forEach(btn => { btn.disabled = i >= total - getVisibleCount() })
  }

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => scrollToIndex(Math.max(0, getActiveIndex() - 1)))
  })
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => scrollToIndex(Math.min(total - 1, getActiveIndex() + 1)))
  })

  track.addEventListener('scroll', updateUI, { passive: true })
  window.addEventListener('resize', updateUI, { passive: true })
  updateUI()
}
