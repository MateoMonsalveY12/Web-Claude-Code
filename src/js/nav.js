/**
 * Sticky Navigation
 * - Positions nav directly below announcement bar while bar is visible
 * - Snaps to top:0 once bar scrolls out of viewport
 * - Toggles data-scrolled="true" after 80px scroll (triggers white bg)
 * - Mobile menu open/close via native <dialog>
 */
export function initNav() {
  const nav  = document.getElementById('site-nav')
  const bar  = document.getElementById('announcement-bar')
  const html = document.documentElement

  if (!nav) return

  // ── Dynamic top positioning ────────────────────────────────────
  // Re-calculates every scroll frame so nav always sits flush below
  // the announcement bar while it's visible, then snaps to top:0.
  function updateNavTop() {
    if (bar) {
      const barBottom = bar.getBoundingClientRect().bottom
      nav.style.top = `${Math.max(0, barBottom)}px`
    } else {
      nav.style.top = '0px'
    }
  }

  // ── Scroll-aware state ─────────────────────────────────────────
  function onScroll() {
    updateNavTop()
    nav.dataset.scrolled = window.scrollY > 80 ? 'true' : 'false'
  }

  // Run once immediately on load
  updateNavTop()
  onScroll()

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', updateNavTop, { passive: true })

  // ── Navbar height CSS var (for page offset calculations) ───────
  function syncNavHeight() {
    html.style.setProperty('--navbar-height', `${nav.getBoundingClientRect().height}px`)
  }
  syncNavHeight()
  new ResizeObserver(syncNavHeight).observe(nav)

  // ── Mobile menu ────────────────────────────────────────────────
  const menuDialog = document.getElementById('mobile-menu')
  const menuOpen   = document.getElementById('menu-open')
  const menuClose  = document.getElementById('menu-close')

  if (menuDialog && menuOpen) {
    menuOpen.addEventListener('click', () => {
      menuDialog.showModal()
      document.body.style.overflow = 'hidden'
    })
  }

  if (menuDialog && menuClose) {
    menuClose.addEventListener('click', () => {
      menuDialog.close()
      document.body.style.overflow = ''
    })
  }

  // Close on backdrop click
  if (menuDialog) {
    menuDialog.addEventListener('click', (e) => {
      if (e.target === menuDialog) {
        menuDialog.close()
        document.body.style.overflow = ''
      }
    })
  }
}
