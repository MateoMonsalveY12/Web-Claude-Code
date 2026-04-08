/**
 * AdminHomePage — /admin/home
 *
 * 8-card grid for managing the home section images (hero slides,
 * collection cards, editorial split, promo editorial).
 * Each card shows the current image, its label, and a "Cambiar imagen"
 * button. Selecting a file triggers immediate preview → Guardar → upload
 * to Supabase Storage + update DB → toast notification.
 */
import { useEffect, useState, useRef } from 'react'
import { useAdminAuth } from '../../hooks/useAdminAuth.js'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { invalidateHomeSectionsCache } from '../../hooks/useHomeSections.js'

// ── Section metadata (display labels + fallback paths) ────────────────────────
const SECTIONS = [
  { id: 'hero_1',             label: 'Hero — Slide 1',                  fallback: '/images/hero-bialy-1.jpg' },
  { id: 'hero_2',             label: 'Hero — Slide 2',                  fallback: '/images/hero-bialy-2.jpg' },
  { id: 'estilo_casual',      label: 'Colecciones — Vestidos',          fallback: '/images/estilo-casual.jpg' },
  { id: 'estilo_elegante',    label: 'Colecciones — Blusas',            fallback: '/images/estilo-elegante.jpg' },
  { id: 'estilo_romantico',   label: 'Colecciones — Tallas Grandes',    fallback: '/images/estilo-romantico.jpg' },
  { id: 'vestido_eleccion_1', label: 'Editorial Split — Principal',     fallback: '/images/vestido-eleccion-1.jpg' },
  { id: 'vestido_eleccion_2', label: 'Editorial Split — Acento',        fallback: '/images/vestido-eleccion-2.jpg' },
  { id: 'detalle_tela',       label: 'Promo Editorial',                 fallback: '/images/detalle-tela.jpg' },
]

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border font-sans text-sm font-medium
      ${type === 'success' ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'}`}>
      {type === 'success'
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {message}
    </div>
  )
}

// ── Image card ────────────────────────────────────────────────────────────────
function SectionCard({ section, currentUrl, onSaved }) {
  const fileRef    = useRef()
  const [preview,  setPreview]  = useState(null)   // base64 data URL for local preview
  const [pending,  setPending]  = useState(null)   // { base64, mimeType, filename }
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = ev => {
      setPreview(ev.target.result)  // data URL for img src
      const base64 = ev.target.result.split(',')[1]
      setPending({
        base64,
        mimeType: file.type,
        filename: `${section.id}-${Date.now()}.${file.type.split('/')[1] || 'jpg'}`,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleDiscard() {
    setPreview(null)
    setPending(null)
    setError('')
  }

  async function handleSave() {
    if (!pending) return
    setSaving(true)
    setError('')
    try {
      const res  = await fetch('/api/admin?action=home-update-image', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({
          sectionId:   section.id,
          imageBase64: pending.base64,
          mimeType:    pending.mimeType,
          filename:    pending.filename,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      // Invalidate the frontend singleton cache so the home page reloads fresh
      invalidateHomeSectionsCache()

      onSaved(section.id, data.imageUrl)
      setPreview(null)
      setPending(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const displayUrl = preview || currentUrl

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Image preview */}
      <div className="relative aspect-[4/3] bg-slate-800 overflow-hidden">
        <img
          src={displayUrl}
          alt={section.label}
          className="w-full h-full object-cover object-center"
          onError={e => { e.currentTarget.src = '/images/hero-bialy-1.jpg' }}
        />
        {preview && (
          <div className="absolute top-2 right-2">
            <span className="font-sans text-[0.65rem] uppercase tracking-wider bg-yellow-500 text-yellow-900 font-semibold px-2 py-0.5 rounded">
              Sin guardar
            </span>
          </div>
        )}
        {saving && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Info + actions */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <p className="font-sans text-xs text-slate-500 uppercase tracking-wider mb-0.5">Sección</p>
          <p className="font-sans text-sm font-medium text-white leading-snug">{section.label}</p>
          <p className="font-mono text-[0.65rem] text-slate-600 mt-0.5">{section.id}</p>
        </div>

        {error && (
          <p className="font-sans text-xs text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded">
            {error}
          </p>
        )}

        {pending ? (
          <div className="flex gap-2 mt-auto">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white text-slate-900 font-sans text-xs font-semibold py-2 rounded hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />}
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="font-sans text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 py-2 px-3 rounded transition-colors"
            >
              Descartar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-auto flex items-center justify-center gap-2 w-full font-sans text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 py-2 rounded transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Cambiar imagen
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminHomePage() {
  const { authenticated, loading: authLoading } = useAdminAuth()
  const [sectionUrls, setSectionUrls] = useState(
    Object.fromEntries(SECTIONS.map(s => [s.id, s.fallback]))
  )
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [toast,    setToast]    = useState(null)

  useEffect(() => { document.title = 'Home Images — Bialy Admin' }, [])

  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    fetch('/api/admin?action=home-sections', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.sections) {
          const map = {}
          data.sections.forEach(s => { if (s.image_url) map[s.id] = s.image_url })
          setSectionUrls(prev => ({ ...prev, ...map }))
        }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [authenticated])

  function handleSaved(sectionId, newUrl) {
    setSectionUrls(prev => ({ ...prev, [sectionId]: newUrl }))
    setToast({ message: 'Imagen actualizada correctamente', type: 'success' })
  }

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
    </div>
  )
  if (!authenticated) return null

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-sans text-xl font-bold text-white">Imágenes del Home</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5">
            Cambia las imágenes de cada sección de la página de inicio. JPEG / PNG / WEBP, máx. 10 MB.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 font-sans text-sm px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SECTIONS.map(s => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="aspect-[4/3] bg-slate-800 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-800 rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-slate-800 rounded animate-pulse" />
                  <div className="h-8 bg-slate-800 rounded animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SECTIONS.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                currentUrl={sectionUrls[section.id] ?? section.fallback}
                onSaved={handleSaved}
              />
            ))}
          </div>
        )}

        {/* Info note */}
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg px-4 py-3 flex gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-blue-400 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="font-sans text-xs text-blue-300 leading-relaxed">
            Las imágenes se almacenan en Supabase Storage (bucket <code className="font-mono bg-blue-900/40 px-1 rounded">home-images</code>).
            Los cambios se reflejan en el home de la tienda en el siguiente refresco de página.
            Las imágenes locales se usan como fallback si Supabase no está disponible.
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
