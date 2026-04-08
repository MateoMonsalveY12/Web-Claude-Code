import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useAdminAuth } from '../../hooks/useAdminAuth.js'
import AdminLayout from '../../components/admin/AdminLayout.jsx'

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'vestidos',          label: 'Vestidos' },
  { value: 'blusas',            label: 'Blusas' },
  { value: 'jeans',             label: 'Jeans' },
  { value: 'accesorios',        label: 'Accesorios' },
  { value: 'nueva-coleccion',   label: 'Nueva colección' },
  { value: 'tallas-grandes',    label: 'Tallas grandes' },
  { value: 'rebajas',           label: 'Rebajas' },
]

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]))

const MAX_IMAGES = 5

function fmt(n) { return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO') }

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Small UI components ───────────────────────────────────────────────────────

function StockBadge({ stock }) {
  if (stock === null || stock === undefined) return <span className="font-sans text-xs text-slate-500">—</span>
  if (stock === 0)
    return <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-red-900/40 text-red-300 border-red-700">Agotado</span>
  if (stock <= 5)
    return <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-yellow-900/40 text-yellow-300 border-yellow-700">{stock} uds</span>
  return <span className="font-sans text-sm text-white">{stock}</span>
}

function StatusBadge({ active }) {
  return active
    ? <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-green-900/40 text-green-300 border-green-700">Activo</span>
    : <span className="inline-block font-sans text-xs font-medium px-2 py-0.5 border rounded-sm bg-slate-800 text-slate-400 border-slate-600">Inactivo</span>
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-700'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
      </div>
      {label && <span className="font-sans text-sm text-slate-300">{label}</span>}
    </label>
  )
}

function Toast({ message, type = 'success', onClose }) {
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

// ── Image uploader slot ────────────────────────────────────────────────────────

function ImageSlot({ url, index, onUpload, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload  = () => res(reader.result.split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      await onUpload(index, base64, file.type, file.name)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="relative group">
      {url ? (
        <div className="relative w-full aspect-[3/4] bg-slate-800 rounded overflow-hidden border border-slate-700">
          <img src={url} alt="" className="w-full h-full object-cover object-top" />
          {/* Overlay controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="font-sans text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded transition-colors"
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="font-sans text-xs bg-red-600/70 hover:bg-red-600 text-white px-3 py-1.5 rounded transition-colors"
            >
              Eliminar
            </button>
          </div>
          {/* Order arrows */}
          <div className="absolute top-1 left-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isFirst && (
              <button type="button" onClick={() => onMoveUp(index)} className="w-6 h-6 bg-black/60 hover:bg-black rounded text-white flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
            )}
            {!isLast && (
              <button type="button" onClick={() => onMoveDown(index)} className="w-6 h-6 bg-black/60 hover:bg-black rounded text-white flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            )}
          </div>
          {index === 0 && (
            <span className="absolute top-1 right-1 font-sans text-[0.6rem] uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded">Principal</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative w-full aspect-[3/4] bg-slate-800 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded flex flex-col items-center justify-center gap-2 transition-colors group"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600 group-hover:text-slate-400 transition-colors">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="font-sans text-xs text-slate-600 group-hover:text-slate-400 transition-colors">Agregar</span>
            </>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Variants table ─────────────────────────────────────────────────────────────

function VariantsTable({ variants, onChange }) {
  function addRow() {
    onChange([...variants, { size: '', color: '', stock: 0, sku: '' }])
  }
  function removeRow(i) {
    onChange(variants.filter((_, idx) => idx !== i))
  }
  function updateRow(i, field, value) {
    const next = variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-700">
              {['Talla', 'Color', 'Stock', 'SKU', ''].map(h => (
                <th key={h} className="text-left px-2 py-2 font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 first:pl-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {variants.map((v, i) => (
              <tr key={i}>
                <td className="px-2 py-2 first:pl-0">
                  <input
                    type="text" value={v.size} placeholder="S / M / L…"
                    onChange={e => updateRow(i, 'size', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-2 py-1.5 rounded outline-none focus:border-slate-500 placeholder-slate-600"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text" value={v.color} placeholder="Negro…"
                    onChange={e => updateRow(i, 'color', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-2 py-1.5 rounded outline-none focus:border-slate-500 placeholder-slate-600"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number" min="0" value={v.stock}
                    onChange={e => updateRow(i, 'stock', Number(e.target.value))}
                    className="w-20 bg-slate-800 border border-slate-700 text-white font-sans text-sm px-2 py-1.5 rounded outline-none focus:border-slate-500"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text" value={v.sku} placeholder="BIA-001-S"
                    onChange={e => updateRow(i, 'sku', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-2 py-1.5 rounded outline-none focus:border-slate-500 placeholder-slate-600 font-mono"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <button type="button" onClick={() => removeRow(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-0 py-4 text-center font-sans text-xs text-slate-600">
                  Sin variantes — agrega tallas y colores
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 font-sans text-xs text-slate-400 hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Agregar variante
      </button>
    </div>
  )
}

// ── Product modal ──────────────────────────────────────────────────────────────

const EMPTY_PRODUCT = {
  name: '', slug: '', description: '', category: 'vestidos',
  subcategory: '', fabric: '',
  price: '', compare_price: '',
  badge: '',
  tags: '',
  is_available: true, is_featured: false,
  is_new: false, is_on_sale: false, is_basics: false, is_warm_season: false,
  images: [], variants: [],
}

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm]       = useState(() => product ? {
    ...product,
    price:         product.price ?? '',
    compare_price: product.compare_price ?? '',
    subcategory:   product.subcategory ?? '',
    fabric:        product.fabric ?? '',
    badge:         product.badge ?? '',
    tags:          Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags ?? ''),
    is_new:        Boolean(product.is_new),
    is_on_sale:    Boolean(product.is_on_sale),
    is_basics:     Boolean(product.is_basics),
    is_warm_season: Boolean(product.is_warm_season),
    images:        Array.isArray(product.images) ? [...product.images] : [],
    variants:      Array.isArray(product.variants) ? [...product.variants] : [],
  } : { ...EMPTY_PRODUCT })

  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})
  const [activeTab, setActiveTab] = useState('info')

  // Auto-slug from name (only when creating)
  const slugLocked = !!product
  useEffect(() => {
    if (!slugLocked && form.name) {
      setForm(f => ({ ...f, slug: slugify(f.name) }))
    }
  }, [form.name, slugLocked])

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => { const next = { ...e }; delete next[field]; return next })
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())     errs.name     = 'El nombre es requerido'
    if (!form.slug.trim())     errs.slug     = 'El slug es requerido'
    if (!form.category)        errs.category = 'La categoría es requerida'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errs.price = 'Precio válido requerido'
    if (form.images.length === 0) errs.images = 'Al menos una imagen es requerida'
    return errs
  }

  async function uploadImage(index, base64, mimeType, filename) {
    const ext  = mimeType.split('/')[1] || 'jpg'
    const name = `${slugify(form.name || 'producto')}-${Date.now()}-${index}.${ext}`
    const res  = await fetch('/api/admin?action=product-upload-image', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType, filename: name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
    const newImages = [...form.images]
    newImages[index] = data.url
    setForm(f => ({ ...f, images: newImages }))
  }

  function removeImage(index) {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  function moveImageUp(index) {
    if (index === 0) return
    const imgs = [...form.images]
    ;[imgs[index - 1], imgs[index]] = [imgs[index], imgs[index - 1]]
    setForm(f => ({ ...f, images: imgs }))
  }

  function moveImageDown(index) {
    if (index >= form.images.length - 1) return
    const imgs = [...form.images]
    ;[imgs[index], imgs[index + 1]] = [imgs[index + 1], imgs[index]]
    setForm(f => ({ ...f, images: imgs }))
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); setActiveTab(errs.images && !errs.name && !errs.price ? 'images' : 'info'); return }

    setSaving(true)
    try {
      const cpNum   = form.compare_price ? Number(form.compare_price) : null
      const prNum   = Number(form.price)
      const discPct = cpNum && cpNum > prNum
        ? Math.round((cpNum - prNum) / cpNum * 100)
        : null

      // Auto-badge when on sale and compare_price set, unless user typed a custom one
      let badgeVal = form.badge?.trim() || null
      if (!badgeVal && form.is_on_sale && discPct) {
        badgeVal = `REBAJAS -${discPct}%`
      }

      const payload = {
        name:          form.name.trim(),
        slug:          form.slug.trim(),
        description:   form.description?.trim() || null,
        category:      form.category,
        subcategory:   form.subcategory?.trim() || null,
        fabric:        form.fabric?.trim() || null,
        price:         prNum,
        compare_price: cpNum,
        badge:         badgeVal,
        tags:          form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        is_available:  form.is_available,
        is_featured:   form.is_featured,
        is_new:        form.is_new,
        is_on_sale:    form.is_on_sale,
        is_basics:     form.is_basics,
        is_warm_season: form.is_warm_season,
        images:        form.images,
        variants:      form.variants,
      }

      const url = product
        ? `/api/admin?action=product-update&id=${product.id}`
        : '/api/admin?action=product-create'
      const method = product ? 'PATCH' : 'POST'

      const res  = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onSaved(product ? 'updated' : 'created', data.product)
    } catch (err) {
      setErrors({ _global: err.message })
    } finally {
      setSaving(false)
    }
  }

  const imageSlots = [...form.images]
  while (imageSlots.length < MAX_IMAGES) imageSlots.push(null)

  const totalStock = form.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-sans text-base font-semibold text-white">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6">
          {[
            { key: 'info',     label: 'Información' },
            { key: 'images',   label: `Imágenes${errors.images ? ' ⚠' : ''}` },
            { key: 'variants', label: `Variantes (${form.variants.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`font-sans text-sm px-4 py-3 border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          <div className="p-6 space-y-5">
            {/* Global error */}
            {errors._global && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 font-sans text-sm px-4 py-3 rounded">
                {errors._global}
              </div>
            )}

            {/* ── INFO TAB ── */}
            {activeTab === 'info' && (
              <div className="space-y-5">
                {/* Name + Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Nombre <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text" value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="Vestido negro con vuelo"
                      className={`w-full bg-slate-800 border text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 placeholder-slate-600 ${errors.name ? 'border-red-600' : 'border-slate-700'}`}
                    />
                    {errors.name && <p className="font-sans text-xs text-red-400 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Slug <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text" value={form.slug}
                      onChange={e => setField('slug', e.target.value)}
                      placeholder="vestido-negro-vuelo"
                      className={`w-full bg-slate-800 border text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 placeholder-slate-600 font-mono ${errors.slug ? 'border-red-600' : 'border-slate-700'}`}
                    />
                    {errors.slug && <p className="font-sans text-xs text-red-400 mt-1">{errors.slug}</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Descripción</label>
                  <textarea
                    value={form.description} rows={3}
                    onChange={e => setField('description', e.target.value)}
                    placeholder="Describe el producto, materiales, cuidados…"
                    className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 placeholder-slate-600 resize-none"
                  />
                </div>

                {/* Category + Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Categoría <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={e => setField('category', e.target.value)}
                      className={`w-full bg-slate-800 border text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 ${errors.category ? 'border-red-600' : 'border-slate-700'}`}
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Subcategoría</label>
                    <input
                      type="text" value={form.subcategory}
                      onChange={e => setField('subcategory', e.target.value)}
                      placeholder="midi, maxi, corto, skinny, wide-leg…"
                      className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Price + Compare + Fabric */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Precio COP <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number" min="0" step="100" value={form.price}
                      onChange={e => setField('price', e.target.value)}
                      placeholder="89000"
                      className={`w-full bg-slate-800 border text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 ${errors.price ? 'border-red-600' : 'border-slate-700'}`}
                    />
                    {errors.price && <p className="font-sans text-xs text-red-400 mt-1">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Precio tachado</label>
                    <input
                      type="number" min="0" step="100" value={form.compare_price}
                      onChange={e => setField('compare_price', e.target.value)}
                      placeholder="120000"
                      className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400"
                    />
                    {(() => {
                      const cp = Number(form.compare_price)
                      const pr = Number(form.price)
                      if (cp > pr && pr > 0) {
                        const pct = Math.round((cp - pr) / cp * 100)
                        return <p className="font-sans text-xs text-green-400 mt-1">Descuento: {pct}% off</p>
                      }
                      return null
                    })()}
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Material / Tela</label>
                    <input
                      type="text" value={form.fabric}
                      onChange={e => setField('fabric', e.target.value)}
                      placeholder="Algodón 100%, lino, viscosa…"
                      className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Tags (separados por coma)</label>
                  <input
                    type="text" value={form.tags}
                    onChange={e => setField('tags', e.target.value)}
                    placeholder="verano, vestido, elegante"
                    className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 placeholder-slate-600"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Badge personalizado
                    <span className="ml-2 font-normal normal-case text-slate-600">(vacío = ninguno; si "En rebaja" está activo se calcula automáticamente)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text" value={form.badge}
                      onChange={e => setField('badge', e.target.value)}
                      placeholder='REBAJAS -21% · NUEVO · EXCLUSIVO…'
                      className="flex-1 bg-slate-800 border border-slate-700 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 placeholder-slate-600"
                    />
                    {(form.badge?.trim() || (form.is_on_sale && (() => {
                      const cp = Number(form.compare_price); const pr = Number(form.price)
                      return cp > pr && pr > 0
                    })())) && (
                      <span className="shrink-0 font-sans text-xs font-semibold bg-slate-700 text-white px-2.5 py-1 rounded border border-slate-600">
                        {form.badge?.trim() || (() => {
                          const cp = Number(form.compare_price); const pr = Number(form.price)
                          return `REBAJAS -${Math.round((cp - pr) / cp * 100)}%`
                        })()}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Estado y visibilidad ── */}
                <div className="pt-1 space-y-3">
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500">Estado y visibilidad</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    <Toggle checked={form.is_available}   onChange={v => setField('is_available', v)}   label="Producto activo" />
                    <Toggle checked={form.is_featured}    onChange={v => setField('is_featured', v)}    label="Destacado en home" />
                  </div>
                </div>

                {/* ── Badges y colecciones especiales ── */}
                <div className="space-y-3">
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500">Colecciones especiales</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    <Toggle checked={form.is_new}         onChange={v => setField('is_new', v)}         label="Es nuevo" />
                    <Toggle checked={form.is_on_sale}     onChange={v => setField('is_on_sale', v)}     label="En rebaja" />
                    <Toggle checked={form.is_basics}      onChange={v => setField('is_basics', v)}      label="Básicos" />
                    <Toggle checked={form.is_warm_season} onChange={v => setField('is_warm_season', v)} label="Temporada cálida" />
                  </div>
                </div>
              </div>
            )}

            {/* ── IMAGES TAB ── */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <p className="font-sans text-xs text-slate-500">
                  Hasta {MAX_IMAGES} imágenes. La primera es la imagen principal. JPEG / PNG / WEBP, máx. 10 MB.
                </p>
                {errors.images && (
                  <p className="font-sans text-xs text-red-400">{errors.images}</p>
                )}
                <div className="grid grid-cols-5 gap-3">
                  {imageSlots.map((url, i) => (
                    <ImageSlot
                      key={i}
                      index={i}
                      url={url}
                      onUpload={uploadImage}
                      onRemove={removeImage}
                      onMoveUp={moveImageUp}
                      onMoveDown={moveImageDown}
                      isFirst={i === 0 || !url}
                      isLast={i === form.images.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── VARIANTS TAB ── */}
            {activeTab === 'variants' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-sans text-xs text-slate-500">
                    Define tallas, colores y stock por variante.
                  </p>
                  {form.variants.length > 0 && (
                    <span className="font-sans text-xs text-slate-400">
                      Stock total: <strong className="text-white">{totalStock}</strong>
                    </span>
                  )}
                </div>
                <VariantsTable
                  variants={form.variants}
                  onChange={v => setField('variants', v)}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="font-sans text-sm text-slate-400 hover:text-white px-4 py-2 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-white text-slate-900 font-sans text-sm font-semibold px-5 py-2 rounded hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              {saving && <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />}
              {saving ? 'Guardando…' : (product ? 'Guardar cambios' : 'Crear producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Archive confirm modal ──────────────────────────────────────────────────────

function ArchiveModal({ product, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-900/40 border border-yellow-700 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-white mb-1">Archivar producto</h3>
            <p className="font-sans text-sm text-slate-400 leading-relaxed">
              El producto <strong className="text-white">"{product?.name}"</strong> se marcará como inactivo y dejará de mostrarse en la tienda. Puedes volver a activarlo editándolo.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-sm text-slate-400 hover:text-white px-4 py-2 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-sans text-sm font-semibold px-4 py-2 rounded transition-colors disabled:opacity-60"
          >
            {loading && <div className="w-4 h-4 border-2 border-yellow-300/40 border-t-yellow-200 rounded-full animate-spin" />}
            Archivar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const { authenticated, loading: authLoading } = useAdminAuth()
  const [products,    setProducts]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('')
  const [modal,       setModal]       = useState(null)   // null | { mode: 'create'|'edit', product }
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving,   setArchiving]   = useState(false)
  const [toast,       setToast]       = useState(null)

  useEffect(() => { document.title = 'Productos — Bialy Admin' }, [])

  const loadProducts = useCallback(() => {
    setLoading(true)
    setError('')
    fetch('/api/admin?action=products', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => { if (authenticated) loadProducts() }, [authenticated, loadProducts])

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean))
    return [...set].sort()
  }, [products])

  const filtered = useMemo(() => {
    let list = products
    if (catFilter) list = list.filter(p => p.category === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, search, catFilter])

  const kpis = useMemo(() => ({
    total:    products.length,
    active:   products.filter(p => p.is_available !== false).length,
    soldOut:  products.filter(p => (p.stock ?? 0) === 0).length,
    featured: products.filter(p => p.is_featured).length,
  }), [products])

  function handleSaved(mode, savedProduct) {
    setModal(null)
    if (mode === 'created' && savedProduct) {
      setProducts(prev => [savedProduct, ...prev])
    } else if (mode === 'updated' && savedProduct) {
      setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p))
    } else {
      loadProducts() // fallback reload
    }
    setToast({ message: mode === 'created' ? 'Producto creado correctamente' : 'Producto actualizado', type: 'success' })
  }

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)
    try {
      const res  = await fetch(`/api/admin?action=product-delete&id=${archiveTarget.id}`, {
        method: 'POST', credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al archivar')
      setProducts(prev => prev.map(p => p.id === archiveTarget.id ? { ...p, is_available: false } : p))
      setToast({ message: `"${archiveTarget.name}" archivado`, type: 'success' })
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setArchiving(false)
      setArchiveTarget(null)
    }
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
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans text-xl font-bold text-white">Productos</h1>
            <p className="font-sans text-sm text-slate-500 mt-0.5">Catálogo completo de la tienda</p>
          </div>
          <button
            onClick={() => setModal({ mode: 'create', product: null })}
            className="flex items-center gap-2 bg-white text-slate-900 font-sans text-sm font-semibold px-4 py-2 rounded hover:bg-slate-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo producto
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total productos', value: kpis.total,    color: 'text-white' },
            { label: 'Activos',         value: kpis.active,   color: 'text-green-400' },
            { label: 'Agotados',        value: kpis.soldOut,  color: 'text-red-400' },
            { label: 'Destacados',      value: kpis.featured, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <p className="font-sans text-xs text-slate-500 uppercase tracking-widest mb-3">{label}</p>
              <p className={`font-sans text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" placeholder="Buscar por nombre o slug…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white font-sans text-sm pl-9 pr-3 py-2 rounded outline-none focus:border-slate-500 placeholder-slate-600"
            />
          </div>
          <select
            value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
            ))}
          </select>
          <span className="font-sans text-xs text-slate-500">{filtered.length} productos</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-400 font-sans text-sm px-4 py-3 rounded">{error}</div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Imagen', 'Producto', 'Categoría', 'Precio', 'Stock', 'Vendidos', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(product => {
                    const thumb = Array.isArray(product.images) ? product.images[0] : product.images
                    return (
                      <tr key={product.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        {/* Imagen */}
                        <td className="px-4 py-3">
                          {thumb ? (
                            <img
                              src={thumb} alt={product.name}
                              className="w-10 h-12 object-cover rounded bg-slate-700"
                              onError={e => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            <div className="w-10 h-12 bg-slate-700 rounded flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
                                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                              </svg>
                            </div>
                          )}
                        </td>
                        {/* Producto */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="font-sans text-sm text-white truncate">{product.name}</p>
                          <p className="font-sans text-xs text-slate-500 truncate font-mono">{product.slug}</p>
                        </td>
                        {/* Categoría */}
                        <td className="px-4 py-3">
                          <p className="font-sans text-xs text-slate-400">
                            {CATEGORY_LABELS[product.category] ?? product.category ?? '—'}
                          </p>
                        </td>
                        {/* Precio */}
                        <td className="px-4 py-3">
                          <p className="font-sans text-sm font-semibold text-white whitespace-nowrap">{fmt(product.price)}</p>
                          {product.compare_price > product.price && (
                            <p className="font-sans text-xs text-slate-500 line-through">{fmt(product.compare_price)}</p>
                          )}
                        </td>
                        {/* Stock */}
                        <td className="px-4 py-3"><StockBadge stock={product.stock} /></td>
                        {/* Vendidos */}
                        <td className="px-4 py-3">
                          <p className="font-sans text-sm text-slate-400">{product.total_sold ?? 0}</p>
                        </td>
                        {/* Estado */}
                        <td className="px-4 py-3">
                          <StatusBadge active={product.is_available !== false} />
                        </td>
                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setModal({ mode: 'edit', product })}
                              className="font-sans text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded transition-colors"
                            >
                              Editar
                            </button>
                            {product.is_available !== false && (
                              <button
                                onClick={() => setArchiveTarget(product)}
                                className="font-sans text-xs text-slate-500 hover:text-yellow-400 border border-slate-800 hover:border-yellow-700/50 px-2.5 py-1 rounded transition-colors"
                              >
                                Archivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center font-sans text-sm text-slate-600">
                        No se encontraron productos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <ProductModal
          product={modal.product}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {archiveTarget && (
        <ArchiveModal
          product={archiveTarget}
          onClose={() => setArchiveTarget(null)}
          onConfirm={handleArchive}
          loading={archiving}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
