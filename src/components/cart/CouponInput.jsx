import { useState } from 'react'
import { useCart } from '../../context/CartContext'

/**
 * Shared coupon input — reads/writes coupon state via CartContext.
 * Pass `email` prop (optional) to include email validation when applying.
 */
export default function CouponInput({ email, compact = false }) {
  const {
    couponData, couponStatus, couponMsg,
    applyDiscount, removeDiscount,
  } = useCart()

  const [input, setInput] = useState('')

  if (couponStatus === 'applied' && couponData) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3">
        <div>
          <p className="font-sans text-xs font-semibold text-green-800 uppercase tracking-button">
            {couponData.code}
          </p>
          <p className="font-sans text-xs text-green-700">{couponMsg || couponData.message}</p>
        </div>
        <button
          onClick={removeDiscount}
          className="font-sans text-xs text-green-700 underline hover:text-green-900 ml-4 flex-shrink-0"
        >
          Quitar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Código de descuento"
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && applyDiscount(input, email)}
          className={`input-brand flex-1 uppercase ${compact ? 'py-2.5 text-sm' : ''}`}
        />
        <button
          onClick={() => applyDiscount(input, email)}
          disabled={couponStatus === 'validating' || !input.trim()}
          className={`btn-ghost whitespace-nowrap disabled:opacity-60 ${compact ? 'btn-sm' : ''}`}
        >
          {couponStatus === 'validating' ? '…' : 'Aplicar'}
        </button>
      </div>
      {couponStatus === 'error' && couponMsg && (
        <p className="font-sans text-xs text-red-500">{couponMsg}</p>
      )}
    </div>
  )
}
