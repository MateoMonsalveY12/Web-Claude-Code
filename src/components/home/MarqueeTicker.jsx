const ITEMS = [
  'Nueva Colección', 'Vestidos', 'Blusas', 'Jeans & Pantalones',
  'Tallas Grandes', 'Envío Gratis +$200K', 'Devoluciones 30 días',
]

const SEPARATOR = <span className="text-brand-red">✦</span>

export default function MarqueeTicker() {
  const content = ITEMS.flatMap((item, i) => [
    <span key={`item-${i}`}>{item}</span>,
    <span key={`sep-${i}`} className="text-brand-red mx-5">✦</span>,
  ])

  return (
    <div className="bg-brand-black text-brand-white overflow-hidden py-3.5 select-none">
      <div className="marquee-track flex whitespace-nowrap">
        <span className="marquee-content inline-flex items-center gap-0 pr-0 shrink-0 font-sans text-[0.6875rem] uppercase tracking-button">
          {content}
        </span>
        <span className="marquee-content inline-flex items-center gap-0 pr-0 shrink-0 font-sans text-[0.6875rem] uppercase tracking-button" aria-hidden="true">
          {content}
        </span>
      </div>
    </div>
  )
}
