import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { MOCK_PRODUCTS } from '../lib/mockData.js'

/**
 * useProducts({ category, subcategory, sizes, colors, minPrice, maxPrice, limit, featured })
 *
 * Uses Supabase when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set,
 * otherwise falls back to mockData.js (demo mode — no .env required).
 *
 * ─── HOW TO CONNECT SUPABASE ─────────────────────────────────────────────────
 * 1. Create a project at supabase.com → copy URL + anon key.
 * 2. Copy .env.example → .env and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
 * 3. In Supabase, create a "products" table with columns:
 *      id (uuid, pk), name (text), slug (text, unique), price (int8),
 *      compare_price (int8, nullable), description (text),
 *      category (text), subcategory (text, nullable),
 *      sizes (text[]), colors (text[]), images (text[]),
 *      badge (text, nullable), is_new (bool), is_featured (bool),
 *      created_at (timestamptz, default now())
 * 4. Enable RLS: CREATE POLICY "public read" ON products FOR SELECT USING (true);
 * 5. Upload products → the site will automatically switch to Supabase.
 *
 * Supported categories: vestidos, blusas, jeans, tallas-grandes, nueva-coleccion,
 *   rebajas, accesorios, uniformes, bono-regalo
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
          if (filters.colors?.length) {
            query = query.overlaps('colors', filters.colors)
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
          if (filters.colors?.length)
            result = result.filter(p => filters.colors.some(c => p.colors.includes(c)))
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
    filters.colors?.join(','),
  ])

  return { products, loading, error }
}
