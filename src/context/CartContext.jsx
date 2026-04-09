import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CartContext = createContext(null)

const FREE_SHIPPING  = 180000
const COUPON_KEY     = 'bialy-coupon'
const SAVE_DEBOUNCE  = 800   // ms — debounce for Supabase cart UPSERT

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadCoupon() {
  try { return JSON.parse(localStorage.getItem(COUPON_KEY)) || null } catch { return null }
}

// ── Supabase cart helpers (called outside React render cycle) ─────────────────
async function dbLoadCart(userId) {
  if (!supabase || !userId) return []
  try {
    const { data, error } = await supabase
      .from('user_carts')
      .select('items')
      .eq('user_id', userId)
      .single()
    if (error?.code === 'PGRST116') {
      console.log('[cart:persist] No hay carrito guardado para este usuario')
      return []
    }
    if (error) { console.warn('[cart:persist] dbLoadCart error:', error.message); return [] }
    console.log(`[cart:persist] Carrito cargado — ${(data.items || []).length} ítem(s)`)
    return Array.isArray(data.items) ? data.items : []
  } catch (err) {
    console.warn('[cart:persist] dbLoadCart exception:', err.message)
    return []
  }
}

async function dbSaveCart(userId, items) {
  if (!supabase || !userId) return
  try {
    const { error } = await supabase
      .from('user_carts')
      .upsert(
        { user_id: userId, items, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    if (error) { console.warn('[cart:persist] dbSaveCart error:', error.message); return }
    console.log(`[cart:persist] Carrito guardado — ${items.length} ítem(s)`)
  } catch (err) {
    console.warn('[cart:persist] dbSaveCart exception:', err.message)
  }
}

// Merge two item arrays: saved is the base, guest items are added/summed on top
function mergeItems(savedItems, guestItems) {
  if (!guestItems?.length) return savedItems
  if (!savedItems?.length) return guestItems

  const result = [...savedItems]
  for (const guest of guestItems) {
    const key = `${guest.id}|${guest.size ?? ''}|${guest.color ?? ''}`
    const idx = result.findIndex(
      i => `${i.id}|${i.size ?? ''}|${i.color ?? ''}` === key
    )
    if (idx >= 0) {
      result[idx] = { ...result[idx], quantity: result[idx].quantity + guest.quantity }
    } else {
      result.push(guest)
    }
  }
  return result
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bialy-cart')) || [] } catch { return [] }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [mergeToast,  setMergeToast]  = useState(false)   // guest-merge notification

  // ── Coupon state ─────────────────────────────────────────────────────────────
  const [couponData,   setCouponData]   = useState(loadCoupon)
  const [couponStatus, setCouponStatus] = useState(() => loadCoupon() ? 'applied' : 'idle')
  const [couponMsg,    setCouponMsg]    = useState('')

  // ── Refs (sync-readable in async callbacks, no stale closure) ────────────────
  const itemsRef          = useRef(items)
  const currentUserIdRef  = useRef(null)
  const saveTimerRef      = useRef(null)

  useEffect(() => { itemsRef.current = items }, [items])

  // ── Persist coupon ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (couponData) localStorage.setItem(COUPON_KEY, JSON.stringify(couponData))
    else            localStorage.removeItem(COUPON_KEY)
  }, [couponData])

  // ── Persist cart to localStorage (always) ────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('bialy-cart', JSON.stringify(items))
  }, [items])

  // ── Debounced Supabase cart save ──────────────────────────────────────────────
  useEffect(() => {
    const userId = currentUserIdRef.current
    if (!userId) return                          // guest — localStorage only

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      dbSaveCart(userId, items)
    }, SAVE_DEBOUNCE)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [items])

  // ── Auth listener ─────────────────────────────────────────────────────────────
  // Uses TWO userId trackers:
  //   prevUserId   — follows the live session (null after SIGNED_OUT)
  //   stableUserId — survives SIGNED_OUT so we can detect same-user re-auth
  //
  // Why: Supabase can emit SIGNED_OUT + SIGNED_IN for the SAME user during a
  // silent token refresh (e.g. when the tab regains focus). The 200ms debounce
  // on SIGNED_OUT lets us cancel the cart clear if SIGNED_IN for the same user
  // arrives within that window.  TOKEN_REFRESHED is handled as an explicit no-op.
  useEffect(() => {
    if (!supabase) return

    let prevUserId   = null  // current session state
    let stableUserId = null  // last confirmed userId — survives SIGNED_OUT
    let signOutTimer = null  // debounce handle for delayed cart clear

    // ── Seed tracking vars only (no cart loading — that belongs to INITIAL_SESSION)
    // This runs as a safety net in case TOKEN_REFRESHED fires before INITIAL_SESSION.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null
      if (!prevUserId) prevUserId               = uid
      if (!stableUserId && uid) stableUserId    = uid
      if (!currentUserIdRef.current) currentUserIdRef.current = uid
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id ?? null
      console.log(`[cart:auth] ${event} | prev=${prevUserId} stable=${stableUserId} new=${newUserId}`)

      // ── TOKEN_REFRESHED: same user, always a no-op ────────────────────────
      if (event === 'TOKEN_REFRESHED') {
        prevUserId               = newUserId
        currentUserIdRef.current = newUserId
        if (newUserId) stableUserId = newUserId
        console.log('[cart] Token renovado — carrito intacto')
        return
      }

      // ── INITIAL_SESSION: fires once at app load with the current session state.
      // This is the ONLY path that hydrates the cart for already-logged-in users.
      // NEVER merge localStorage here: localStorage is a copy of the SAME data
      // that was written during the previous session. Merging would double everything.
      if (event === 'INITIAL_SESSION') {
        prevUserId               = newUserId
        stableUserId             = newUserId
        currentUserIdRef.current = newUserId

        if (newUserId) {
          dbLoadCart(newUserId).then(savedItems => {
            if (savedItems.length > 0) {
              // Supabase is the canonical source. Replace state outright — no merge.
              setItems(savedItems)
            } else if (itemsRef.current.length > 0) {
              // Supabase empty (new user / first use of user_carts).
              // Persist whatever is already in localStorage so it survives future logins.
              dbSaveCart(newUserId, itemsRef.current)
            }
          })
        }
        return
      }

      // ── SIGNED_OUT: real sign-out OR token-refresh artifact ───────────────
      // Debounce: wait 200ms before clearing. If SIGNED_IN for the same user
      // arrives first, we cancel — it was just a background token refresh.
      if (event === 'SIGNED_OUT') {
        if (signOutTimer) clearTimeout(signOutTimer)
        prevUserId               = null
        currentUserIdRef.current = null
        // stableUserId intentionally left unchanged — needed for same-user check below

        signOutTimer = setTimeout(() => {
          signOutTimer = null
          if (!currentUserIdRef.current) {
            // No SIGNED_IN followed → confirmed real sign-out
            console.log('[cart] Sesión cerrada — limpiando carrito')
            stableUserId = null
            setItems([])
            setCouponData(null)
            setCouponStatus('idle')
            setCouponMsg('')
          }
        }, 200)
        return
      }

      // ── SIGNED_IN / USER_UPDATED: new session established ─────────────────
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && newUserId) {
        // Cancel any pending SIGNED_OUT clear
        if (signOutTimer) {
          clearTimeout(signOutTimer)
          signOutTimer = null
        }

        const isSameUser = newUserId === stableUserId
        prevUserId               = newUserId
        currentUserIdRef.current = newUserId
        stableUserId             = newUserId

        if (isSameUser) {
          // Same user re-authenticated (token refresh cycle) → cart untouched
          console.log('[cart] Misma sesión restaurada — carrito intacto')
          return
        }

        // Different user (or first login with stableUserId=null) → load cart
        console.log('[cart] Nuevo usuario inició sesión')
        const guestItems = itemsRef.current  // capture before any setState
        const savedItems = await dbLoadCart(newUserId)

        // If the user already has a saved cart, it is the authoritative source.
        // Do NOT merge with localStorage — the browser may have left the SPA before
        // the 200ms sign-out debounce fired (e.g. Google OAuth redirect), leaving
        // stale items from the previous session in localStorage. Merging them with
        // savedItems would double everything.
        // Only transfer guest items when there is no existing saved cart.
        const finalItems = savedItems.length > 0 ? savedItems : guestItems
        setItems(finalItems)
        await dbSaveCart(newUserId, finalItems)

        // Show toast only when guest items are actually transferred (empty saved cart)
        if (savedItems.length === 0 && guestItems.length > 0) {
          setCouponData(null)
          setCouponStatus('idle')
          setCouponMsg('')
          setMergeToast(true)
          setTimeout(() => setMergeToast(false), 4000)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      if (signOutTimer) clearTimeout(signOutTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Derived subtotal ──────────────────────────────────────────────────────────
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])

  // ── Discount amount ───────────────────────────────────────────────────────────
  const discountAmount = useMemo(() => {
    if (!couponData) return 0
    if (couponData.type === 'percentage') return Math.round(subtotal * couponData.value / 100)
    return Math.min(couponData.value, subtotal)
  }, [couponData, subtotal])

  // ── Coupon actions ────────────────────────────────────────────────────────────
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

  // ── Cart mutations ────────────────────────────────────────────────────────────
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

  // ── Derived values ────────────────────────────────────────────────────────────
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
      // Merge toast
      mergeToast,
      clearMergeToast: () => setMergeToast(false),
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
