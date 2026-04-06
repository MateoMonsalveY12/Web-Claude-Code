import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { MOCK_PRODUCTS } from '../lib/mockData.js'

/**
 * useProducts({ category, subcategory, sizes, colors, minPrice, maxPrice, limit, featured })
 * Falls back to mock data when Supabase is not configured.
 */
export function useProducts(filters = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      setLoading(true)
      setError(null)

      try {
        if (supabase) {
          // ── Supabase query ───────────────────────────────────────
          let query = supabase.from('products').select('*')

          if (filters.category)    query = query.eq('category', filters.category)
          if (filters.subcategory) query = query.eq('subcategory', filters.subcategory)
          if (filters.featured)    query = query.eq('is_featured', true)
          if (filters.minPrice)    query = query.gte('price', filters.minPrice)
          if (filters.maxPrice)    query = query.lte('price', filters.maxPrice)
          if (filters.limit)       query = query.limit(filters.limit)
          if (filters.sizes?.length) {
            query = query.overlaps('sizes', filters.sizes)
          }

          query = query.order('created_at', { ascending: false })

          const { data, error: sbError } = await query
          if (sbError) throw sbError
          if (!cancelled) setProducts(data || [])
        } else {
          // ── Mock data fallback ───────────────────────────────────
          await new Promise(r => setTimeout(r, 400)) // simulate network

          let result = [...MOCK_PRODUCTS]

          if (filters.category)
            result = result.filter(p => p.category === filters.category)
          if (filters.subcategory)
            result = result.filter(p => p.subcategory === filters.subcategory)
          if (filters.featured)
            result = result.filter(p => p.is_featured)
          if (filters.minPrice)
            result = result.filter(p => p.price >= filters.minPrice)
          if (filters.maxPrice)
            result = result.filter(p => p.price <= filters.maxPrice)
          if (filters.sizes?.length)
            result = result.filter(p => filters.sizes.some(s => p.sizes.includes(s)))
          if (filters.limit)
            result = result.slice(0, filters.limit)

          if (!cancelled) setProducts(result)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()
    return () => { cancelled = true }
  }, [
    filters.category,
    filters.subcategory,
    filters.featured,
    filters.minPrice,
    filters.maxPrice,
    filters.limit,
    filters.sizes?.join(','),
  ])

  return { products, loading, error }
}
