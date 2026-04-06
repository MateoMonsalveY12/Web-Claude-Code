import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

function fmt(n) {
  if (n == null) return ''
  return '$ ' + Math.round(n).toLocaleString('es-CO')
}

export default function CartDrawer() {
  const {
    items, isCartOpen, closeCart,
    removeFromCart, updateQuantity,
    subtotal, progressPercent, freeShippingRemaining, cartCount,
  } = useCart()

  const navigate = useNavigate()

  function handleCheckout() {
    closeCart()
    navigate('/checkout')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300"
        style={{ opacity: isCartOpen ? 1 : 0, pointerEvents: isCartOpen ? 'auto' : 'none' }}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white z-[70] flex flex-col"
        style={{
          transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border flex-shrink-0">
          <h2 className="font-display tracking-heading text-xl">
            Carrito ({cartCount})
          </h2>
          <button
            onClick={closeCart}
            className="nav-icon-btn text-brand-black"
            aria-label="Cerrar carrito"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Free shipping progress ── */}
        <div className="px-5 py-3 bg-brand-gray border-b border-brand-border flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-sans text-xs text-brand-black/70 leading-snug flex-1 pr-3">
              {freeShippingRemaining === 0
                ? '¡Tienes Envío GRATIS! 🎉'
                : (
                  <>
                    Ya casi es tuyo: ¡Añade{' '}
                    <strong>{fmt(freeShippingRemaining)}</strong>{' '}
                    y consigue Envío GRATIS!
                  </>
                )
              }
            </p>
            <span className="font-sans text-[0.6rem] uppercase tracking-button text-brand-black/40 whitespace-nowrap flex-shrink-0">
              Envío Gratis
            </span>
          </div>
          <div className="h-[3px] bg-brand-border w-full">
            <div
              className="h-full bg-brand-black transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── Items ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <svg
                className="mx-auto mb-4 text-brand-black/20"
                width="48" height="48" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <p className="font-sans text-sm text-brand-black/40">Tu carrito está vacío</p>
            </div>
          ) : (
            items.map(item => (
              <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3 relative">
                {/* Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 bg-brand-gray overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-5">
                  <p className="font-sans text-[0.7rem] uppercase tracking-button font-semibold text-brand-black leading-tight mb-1">
                    {item.name.length > 42 ? item.name.slice(0, 42) + '…' : item.name}
                  </p>

                  {/* Size + color */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {item.size && (
                      <span className="font-sans text-[0.7rem] text-brand-black/50">{item.size}</span>
                    )}
                    {item.size && item.color && (
                      <span className="font-sans text-[0.7rem] text-brand-black/30">·</span>
                    )}
                    {item.color && (
                      <span
                        className="w-3 h-3 rounded-full border border-brand-border flex-shrink-0"
                        style={{ background: item.color }}
                      />
                    )}
                  </div>

                  <p className="font-sans text-sm font-semibold text-brand-black mb-2">
                    {fmt(item.price)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.size, item.color, -1)}
                      className="w-7 h-7 flex items-center justify-center border border-brand-border font-sans text-sm hover:bg-brand-gray transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <span className="font-sans text-sm min-w-[2rem] h-7 flex items-center justify-center border-t border-b border-brand-border">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.size, item.color, 1)}
                      className="w-7 h-7 flex items-center justify-center border border-brand-border font-sans text-sm hover:bg-brand-gray transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.id, item.size, item.color)}
                  className="absolute top-0 right-0 p-1 text-brand-black/30 hover:text-brand-black transition-colors"
                  aria-label="Eliminar producto"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        {items.length > 0 && (
          <div className="border-t border-brand-border px-5 py-4 space-y-3 flex-shrink-0">
            {/* Discount code */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de descuento"
                className="input-brand flex-1 py-2.5 text-sm"
              />
              <button className="btn-ghost btn-sm whitespace-nowrap">
                Aplicar
              </button>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-sans text-sm text-brand-black/60">Subtotal</span>
              <span className="font-sans text-sm font-semibold">{fmt(subtotal)}</span>
            </div>

            {/* CTA */}
            <button onClick={handleCheckout} className="btn-primary w-full text-center">
              Comprar ahora
            </button>
          </div>
        )}
      </div>
    </>
  )
}
