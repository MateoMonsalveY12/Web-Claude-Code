import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { MOCK_PRODUCTS } from '../lib/mockData.js'

/**
 * useProducts(filters)
 *
 * filters: {
 *   category        — string: normal category, 'basicos-esenciales', 'temporada-calida',
 *                     'rebajas', 'nueva-coleccion' (all products), or undefined
 *   subcategory     — string
 *   featured        — boolean: filter by is_featured = true
 *   minPrice        — number
 *   maxPrice        — number
 *   limit           — number
 *   sizes           — string[]
 *   colors          — string[]
 *   fabric          — string[]: filter by fabric values
 *   orderByTotalSold — boolean: sort by total_sold DESC (for Más Vendidos section)
 * }
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

          // Category routing — special cases handled here
          if (filters.category === 'basicos-esenciales') {
            query = query.eq('is_basics', true)
          } else if (filters.category === 'temporada-calida') {
            query = query.eq('is_warm_season', true)
          } else if (filters.category === 'rebajas') {
            // Only products where compare_price > price (stored as generated column)
            query = query.eq('is_on_sale', true)
          } else if (filters.category && filters.category !== 'nueva-coleccion') {
            // Normal category filter; 'nueva-coleccion' = no filter (show all)
            query = query.eq('category', filters.category)
          }

          if (filters.subcategory) query = query.eq('subcategory', filters.subcategory)
          if (filters.featured)    query = query.eq('is_featured', true)
          if (filters.minPrice)    query = query.gte('price', filters.minPrice)
          if (filters.maxPrice)    query = query.lte('price', filters.maxPrice)
          if (filters.limit)       query = query.limit(filters.limit)
          if (filters.sizes?.length)  query = query.overlaps('sizes', filters.sizes)
          if (filters.colors?.length) query = query.overlaps('colors', filters.colors)
          if (filters.fabric?.length) query = query.in('fabric', filters.fabric)

          // Ordering
          if (filters.orderByTotalSold) {
            query = query.order('total_sold', { ascending: false })
          } else {
            query = query.order('created_at', { ascending: false })
          }

          const { data, error: sbError } = await query
          if (sbError) throw sbError
          if (!cancelled) setProducts(data || [])
        } else {
          // ── Mock data fallback ───────────────────────────────────
          await new Promise(r => setTimeout(r, 400))

          let result = [...MOCK_PRODUCTS]

          if (filters.category === 'basicos-esenciales')
            result = result.filter(p => p.is_basics)
          else if (filters.category === 'temporada-calida')
            result = result.filter(p => p.is_warm_season)
          else if (filters.category === 'rebajas')
            result = result.filter(p => p.compare_price && p.compare_price > p.price)
          else if (filters.category && filters.category !== 'nueva-coleccion')
            result = result.filter(p => p.category === filters.category)

          if (filters.subcategory) result = result.filter(p => p.subcategory === filters.subcategory)
          if (filters.featured)    result = result.filter(p => p.is_featured)
          if (filters.minPrice)    result = result.filter(p => p.price >= filters.minPrice)
          if (filters.maxPrice)    result = result.filter(p => p.price <= filters.maxPrice)
          if (filters.sizes?.length)  result = result.filter(p => filters.sizes.some(s => p.sizes?.includes(s)))
          if (filters.colors?.length) result = result.filter(p => filters.colors.some(c => p.colors?.includes(c)))
          if (filters.fabric?.length) result = result.filter(p => filters.fabric.includes(p.fabric))
          if (filters.orderByTotalSold) result = result.sort((a, b) => (b.total_sold ?? 0) - (a.total_sold ?? 0))
          if (filters.limit) result = result.slice(0, filters.limit)

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
    filters.orderByTotalSold,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.sizes?.join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.colors?.join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.fabric?.join(','),
  ])

  return { products, loading, error }
}
