import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  // items: [{ label, href? }, ...]
  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span className="font-sans text-[0.6875rem] text-brand-black/30">/</span>}
            {item.href ? (
              <Link to={item.href} className="font-sans text-[0.6875rem] uppercase tracking-button text-brand-black/50 hover:text-brand-black transition-colors duration-200">
                {item.label}
              </Link>
            ) : (
              <span className="font-sans text-[0.6875rem] uppercase tracking-button text-brand-black">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
