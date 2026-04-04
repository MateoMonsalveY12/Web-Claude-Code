/**
 * Megamenu — desktop hover/keyboard + mobile accordion
 */
export function initMegamenu() {
  const header = document.getElementById('site-nav')
  if (!header) return

  const triggers = Array.from(header.querySelectorAll('[data-megamenu-trigger]'))
  const overlay  = document.getElementById('megamenu-overlay')
  const closeTimers = {}

  // ── Helpers ─────────────────────────────────────────────────────
  function getMenu(id) { return header.querySelector(`#megamenu-${id}`) }
  function getLink(id) { return header.querySelector(`[data-megamenu-trigger="${id}"] a`) }

  function anyOpen() {
    return triggers.some(t => {
      const m = getMenu(t.dataset.megamenuTrigger)
      return m?.classList.contains('megamenu--open')
    })
  }

  function openMenu(id) {
    // Close any other open menu first
    triggers.forEach(t => {
      if (t.dataset.megamenuTrigger !== id) closeImmediately(t.dataset.megamenuTrigger)
    })
    clearTimeout(closeTimers[id])
    getMenu(id)?.classList.add('megamenu--open')
    getLink(id)?.setAttribute('aria-expanded', 'true')
    overlay?.classList.add('megamenu-overlay--visible')
  }

  function scheduleClose(id) {
    closeTimers[id] = setTimeout(() => closeImmediately(id), 180)
  }

  function closeImmediately(id) {
    getMenu(id)?.classList.remove('megamenu--open')
    getLink(id)?.setAttribute('aria-expanded', 'false')
    if (!anyOpen()) overlay?.classList.remove('megamenu-overlay--visible')
  }

  function closeAll() {
    triggers.forEach(t => closeImmediately(t.dataset.megamenuTrigger))
  }

  // ── Desktop hover ────────────────────────────────────────────────
  triggers.forEach(trigger => {
    const id   = trigger.dataset.megamenuTrigger
    const menu = getMenu(id)
    if (!menu) return

    trigger.addEventListener('mouseenter', () => openMenu(id))
    trigger.addEventListener('mouseleave', () => scheduleClose(id))
    menu.addEventListener('mouseenter',   () => clearTimeout(closeTimers[id]))
    menu.addEventListener('mouseleave',   () => scheduleClose(id))

    // Keyboard: Enter toggles, Tab moves inside
    getLink(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault()
        menu.classList.contains('megamenu--open') ? closeAll() : openMenu(id)
        if (!menu.classList.contains('megamenu--open')) return
        menu.querySelector('a')?.focus()
      }
    })
  })

  // Escape closes all
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll() })

  // Overlay click closes all
  overlay?.addEventListener('click', closeAll)

  // Click outside header closes all
  document.addEventListener('click', e => {
    if (!header.contains(e.target) && !overlay?.contains(e.target)) closeAll()
  })

  // ── Mobile accordion ─────────────────────────────────────────────
  document.querySelectorAll('[data-accordion-trigger]').forEach(btn => {
    const id    = btn.dataset.accordionTrigger
    const panel = document.getElementById(`accordion-${id}`)
    if (!panel) return

    btn.addEventListener('click', () => {
      const isOpen = panel.classList.contains('accordion--open')

      // Collapse all
      document.querySelectorAll('.accordion-panel').forEach(p => {
        p.classList.remove('accordion--open')
        p.style.maxHeight = '0px'
      })
      document.querySelectorAll('[data-accordion-trigger]').forEach(b => {
        b.setAttribute('aria-expanded', 'false')
        b.querySelector('.accordion-arrow')?.classList.remove('rotate-180')
      })

      if (!isOpen) {
        panel.classList.add('accordion--open')
        panel.style.maxHeight = panel.scrollHeight + 'px'
        btn.setAttribute('aria-expanded', 'true')
        btn.querySelector('.accordion-arrow')?.classList.add('rotate-180')
      }
    })
  })
}
