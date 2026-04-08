/**
 * useHomeSections — fetches home section image URLs from Supabase.
 *
 * Uses a module-level singleton promise so all components on the same page
 * share a single network request (no duplicate fetches).
 *
 * Falls back to local /images/* paths if Supabase is unavailable or env
 * vars are not set.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

// ── Fallback paths (local static images from src/public/images/) ─────────────
export const HOME_SECTION_FALLBACKS = {
  hero_1:             '/images/hero-bialy-1.jpg',
  hero_2:             '/images/hero-bialy-2.jpg',
  estilo_casual:      '/images/estilo-casual.jpg',
  estilo_elegante:    '/images/estilo-elegante.jpg',
  estilo_romantico:   '/images/estilo-romantico.jpg',
  vestido_eleccion_1: '/images/vestido-eleccion-1.jpg',
  vestido_eleccion_2: '/images/vestido-eleccion-2.jpg',
  detalle_tela:       '/images/detalle-tela.jpg',
}

// ── Module-level singleton (shared across all hook instances on same page) ────
let _promise = null    // Promise<sections map>
let _cache   = null    // Resolved sections map (null = not yet loaded)

/** Force-invalidate the cache (called by AdminHomePage after a successful save) */
export function invalidateHomeSectionsCache() {
  _cache   = null
  _promise = null
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useHomeSections() {
  const [sections, setSections] = useState(_cache ?? HOME_SECTION_FALLBACKS)
  const [loading,  setLoading]  = useState(_cache === null && !!supabase)

  useEffect(() => {
    // Already cached — nothing to do
    if (_cache !== null) {
      setSections(_cache)
      setLoading(false)
      return
    }

    // No Supabase client (env vars not set) — use fallbacks
    if (!supabase) {
      setLoading(false)
      return
    }

    // Start (or reuse) the shared fetch promise
    if (!_promise) {
      _promise = supabase
        .from('home_sections')
        .select('id,image_url')
        .then(({ data, error }) => {
          const map = { ...HOME_SECTION_FALLBACKS }
          if (!error && Array.isArray(data)) {
            data.forEach(row => {
              if (row.id && row.image_url) map[row.id] = row.image_url
            })
          }
          _cache = map
          return map
        })
        .catch(() => {
          // Network error — return fallbacks, clear promise so next mount retries
          _promise = null
          return HOME_SECTION_FALLBACKS
        })
    }

    _promise.then(map => {
      setSections(map)
      setLoading(false)
    })
  }, [])

  return { sections, loading }
}
