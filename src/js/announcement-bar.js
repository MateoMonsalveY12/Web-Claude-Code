/**
 * Announcement Bar — rotates through messages every 4 seconds
 */
export function initAnnouncementBar() {
  const track = document.querySelector('.announcement-track')
  if (!track) return

  const items = track.querySelectorAll('.announcement-item')
  if (items.length <= 1) return

  let index = 0

  setInterval(() => {
    index = (index + 1) % items.length

    if (index === 0) {
      // Instant reset to start, then re-enable transition
      track.style.transition = 'none'
      track.style.transform = 'translateX(0%)'
      // Force reflow so the transition removal takes effect
      track.offsetHeight // eslint-disable-line no-unused-expressions
      requestAnimationFrame(() => {
        track.style.transition = 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)'
      })
    } else {
      track.style.transition = 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)'
      track.style.transform = `translateX(-${index * 100}%)`
    }
  }, 4000)
}
