import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const CartContext = createContext(null)

const FREE_SHIPPING = 180000

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bialy-cart')) || []
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('bialy-cart', JSON.stringify(items))
  }, [items])

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
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        compare_price: product.compare_price ?? null,
        image: product.images?.[0] ?? '',
        size: size ?? null,
        color: color ?? null,
        colorName: color ?? null,
        quantity,
      }]
    })
    setIsCartOpen(true)
  }

  function removeFromCart(id, size, color) {
    setItems(prev =>
      prev.filter(i => !(i.id === id && i.size === size && i.color === color))
    )
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

  const cartCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const subtotal  = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const hasDiscount = useMemo(() => items.some(i => i.compare_price), [items])
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING - subtotal)
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING) * 100)

  return (
    <CartContext.Provider value={{
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
