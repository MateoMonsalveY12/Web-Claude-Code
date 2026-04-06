import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { MOCK_PRODUCTS } from '../lib/mockData.js'

export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function fetchProduct() {
      setLoading(true)
      setError(null)

      try {
        if (supabase) {
          const { data, error: sbError } = await supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .single()
          if (sbError) throw sbError
          if (!cancelled) setProduct(data)
        } else {
          await new Promise(r => setTimeout(r, 300))
          const found = MOCK_PRODUCTS.find(p => p.slug === slug) || null
          if (!cancelled) setProduct(found)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProduct()
    return () => { cancelled = true }
  }, [slug])

  return { product, loading, error }
}
