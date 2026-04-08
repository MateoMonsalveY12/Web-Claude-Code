import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const CartContext = createContext(null)

const FREE_SHIPPING = 180000
const COUPON_KEY    = 'bialy-coupon'

// Safely parse stored coupon
function loadCoupon() {
  try { return JSON.parse(localStorage.getItem(COUPON_KEY)) || null } catch { return null }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bialy-cart')) || [] } catch { return [] }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  // ── Coupon state ────────────────────────────────────────────────────────────
  // couponData = { code, type, value, amount, message } | null
  const [couponData,   setCouponData]   = useState(loadCoupon)
  const [couponStatus, setCouponStatus] = useState(() => loadCoupon() ? 'applied' : 'idle')
  const [couponMsg,    setCouponMsg]    = useState('')

  // Persist coupon in localStorage
  useEffect(() => {
    if (couponData) localStorage.setItem(COUPON_KEY, JSON.stringify(couponData))
    else            localStorage.removeItem(COUPON_KEY)
  }, [couponData])

  // Persist cart items
  useEffect(() => {
    localStorage.setItem('bialy-cart', JSON.stringify(items))
  }, [items])

  // Derived subtotal (needed for coupon calculation)
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])

  // Discount amount — recalculates live when subtotal changes
  const discountAmount = useMemo(() => {
    if (!couponData) return 0
    if (couponData.type === 'percentage') return Math.round(subtotal * couponData.value / 100)
    return Math.min(couponData.value, subtotal)
  }, [couponData, subtotal])

  // Apply or re-validate a coupon code
  // email is optional: required for assigned_email validation (checkout only)
  const applyDiscount = useCallback(async (code, email) => {
    const cleanCode = (code || '').trim().toUpperCase()
    if (!cleanCode) return
    console.log(`[discount] Validando código: ${cleanCode}${email ? ` para email: ${email}` : ''}`)
    setCouponStatus('validating')
    setCouponMsg('')
    try {
      const res  = await fetch('/api/admin?action=validate-discount', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: cleanCode, email: email?.trim() || undefined, subtotal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      if (data.valid) {
        const stored = {
          code:    cleanCode,
          type:    data.discount_type,
          value:   data.discount_value,
          amount:  data.discount_amount,
          message: data.message,
        }
        setCouponData(stored)
        setCouponStatus('applied')
        setCouponMsg(data.message)
        console.log(`[discount] Código válido${email ? ` para email: ${email}` : ''}: ${cleanCode} → −${data.discount_amount}`)
      } else {
        // If re-validating an already-applied code and it fails (e.g. email mismatch), clear it
        if (couponData?.code === cleanCode) setCouponData(null)
        setCouponStatus('error')
        setCouponMsg(data.message || 'Código no válido')
        console.log(`[discount] Código inválido (${cleanCode}): ${data.message}`)
      }
    } catch (err) {
      setCouponStatus('error')
      setCouponMsg('Error al validar el código')
      console.error('[discount] Error al validar:', err.message)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, couponData?.code])

  // Re-validate currently applied code with a new email (called from CheckoutPage)
  const revalidateCoupon = useCallback(async (email) => {
    if (!couponData || couponStatus !== 'applied') return
    await applyDiscount(couponData.code, email)
  }, [couponData, couponStatus, applyDiscount])

  function removeDiscount() {
    setCouponData(null)
    setCouponStatus('idle')
    setCouponMsg('')
    console.log('[discount] Cupón removido')
  }

  // ── Cart functions ──────────────────────────────────────────────────────────
  function addToCart(product, size, color, quantity = 1) {
    setItems(prev => {
      const key = `${product.id}|${size ?? ''}|${color ?? ''}`
      const idx = prev.findIndex(i => `${i.id}|${i.size ?? ''}|${i.color ?? ''}` === key)
      if (idx >= 0) {
        return prev.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [...prev, {
        id:            product.id,
        slug:          product.slug,
        name:          product.name,
        price:         product.price,
        compare_price: product.compare_price ?? null,
        image:         product.images?.[0] ?? '',
        size:          size ?? null,
        color:         color ?? null,
        colorName:     color ?? null,
        quantity,
      }]
    })
    setIsCartOpen(true)
  }

  function removeFromCart(id, size, color) {
    setItems(prev => prev.filter(i => !(i.id === id && i.size === size && i.color === color)))
  }

  function updateQuantity(id, size, color, delta) {
    setItems(prev =>
      prev
        .map(i => {
          if (i.id === id && i.size === size && i.color === color) {
            const newQty = i.quantity + delta
            return newQty > 0 ? { ...i, quantity: newQty } : null
          }
          return i
        })
        .filter(Boolean)
    )
  }

  function clearCart()  { setItems([]) }
  function openCart()   { setIsCartOpen(true) }
  function closeCart()  { setIsCartOpen(false) }
  function toggleCart() { setIsCartOpen(v => !v) }

  const cartCount             = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const hasDiscount           = useMemo(() => items.some(i => i.compare_price), [items])
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING - subtotal)
  const progressPercent       = Math.min(100, (subtotal / FREE_SHIPPING) * 100)

  return (
    <CartContext.Provider value={{
      // Cart
      items,
      isCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      cartCount,
      subtotal,
      hasDiscount,
      freeShippingThreshold: FREE_SHIPPING,
      freeShippingRemaining,
      progressPercent,
      // Coupon
      couponData,
      couponStatus,
      couponMsg,
      discountAmount,
      applyDiscount,
      removeDiscount,
      revalidateCoupon,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
