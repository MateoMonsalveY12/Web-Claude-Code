import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const MESSAGES = [
  { text: 'Envío GRATIS en pedidos mayores a $200.000 · Colombia', link: null },
  { text: 'Nueva Colección 2026 — Vestidos y más', link: '/collections/nueva-coleccion' },
  { text: 'Devoluciones gratuitas en 30 días · Sin preguntas', link: null },
]

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(c => (c + 1) % MESSAGES.length)
        setVisible(true)
      }, 350)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const msg = MESSAGES[current]

  return (
    <div
      className="bg-brand-black text-brand-white text-center text-[0.6875rem] tracking-button uppercase py-2.5 overflow-hidden select-none"
      role="region"
      aria-label="Anuncios"
    >
      <div
        style={{ transition: 'opacity 350ms', opacity: visible ? 1 : 0 }}
        className="flex items-center justify-center gap-2 px-4"
      >
        {msg.link ? (
          <Link to={msg.link} className="hover:underline underline-offset-2">{msg.text}</Link>
        ) : (
          <span>{msg.text}</span>
        )}
      </div>
    </div>
  )
}
