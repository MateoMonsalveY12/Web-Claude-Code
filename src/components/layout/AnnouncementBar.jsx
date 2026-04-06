import { useState, useEffect } from 'react'

const MESSAGES = [
  'Envío gratis en pedidos mayores a $200.000 · Colombia',
  'Nuevas colecciones disponibles — Ver ahora',
  'Devoluciones gratuitas en 30 días · Sin preguntas',
]

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCurrent(c => (c + 1) % MESSAGES.length)
        setFade(true)
      }, 400)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="bg-brand-black text-brand-white text-center text-[0.6875rem] tracking-button uppercase py-2.5 overflow-hidden"
      role="region"
      aria-label="Anuncios promocionales"
    >
      <span
        style={{ transition: 'opacity 400ms', opacity: fade ? 1 : 0 }}
        className="block px-4"
      >
        {MESSAGES[current]}
      </span>
    </div>
  )
}
