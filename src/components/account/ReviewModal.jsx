/**
 * ReviewModal — allows authenticated users to submit a product review
 * after an order has been ENTREGADO.
 *
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   orderId      string (uuid)
 *   customerId   string (uuid) | null
 *   customerName string
 *   product      { slug, name, image }
 *   onSuccess    () => void
 */
import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'

function StarButton({ index, value, onHover, onClick }) {
  const filled = index < value
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(index + 1)}
      onMouseLeave={() => onHover(0)}
      onClick={() => onClick(index + 1)}
      className="p-0.5 transition-transform hover:scale-110"
      aria-label={`${index + 1} estrellas`}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? '#000000' : 'none'} stroke="#000000" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  )
}

export default function ReviewModal({
  isOpen, onClose,
  orderId, customerId, customerName,
  product,
  onSuccess,
}) {
  const [rating,     setRating]     = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment,    setComment]    = useState('')
  const [photo,      setPhoto]      = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const displayRating = hoverRating || rating

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('La foto debe pesar menos de 5 MB.')
      return
    }
    setPhoto(file)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (rating === 0) { setError('Selecciona una calificación.'); return }
    if (comment.trim().length < 20) { setError('El comentario debe tener al menos 20 caracteres.'); return }
    if (!supabase) { setError('No hay conexión con el servidor.'); return }

    // Check if review already exists for this order + product slug
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', orderId)
      .eq('product_slug', product.slug)
      .maybeSingle()

    if (existing) {
      setError('Ya enviaste una reseña para este producto.')
      return
    }

    setSubmitting(true)

    try {
      // Upload photo if selected
      let photoUrl = null
      if (photo) {
        setUploading(true)
        const ext  = photo.name.split('.').pop()
        const path = `${orderId}/${product.slug}-${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reviews')
          .upload(path, photo, { cacheControl: '3600', upsert: false })
        setUploading(false)
        if (uploadError) throw new Error('Error al subir la foto: ' + uploadError.message)
        const { data: { publicUrl } } = supabase.storage.from('reviews').getPublicUrl(uploadData.path)
        photoUrl = publicUrl
      }

      // Resolve product_id by slug
      let productId = null
      const { data: productData } = await supabase
        .from('products')
        .select('id')
        .eq('slug', product.slug)
        .maybeSingle()
      if (productData) productId = productData.id

      // Insert review
      const { error: insertError } = await supabase.from('reviews').insert({
        order_id:      orderId,
        customer_id:   customerId ?? null,
        product_id:    productId ?? null,
        product_slug:  product.slug,
        product_name:  product.name,
        customer_name: customerName,
        rating,
        comment:       comment.trim(),
        photo_url:     photoUrl,
      })

      if (insertError) throw new Error(insertError.message)

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border sticky top-0 bg-white z-10">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-button">Dejar reseña</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product info */}
          <div className="flex items-center gap-4">
            {product.image && (
              <img src={product.image} alt={product.name} className="w-16 h-20 object-cover object-center" />
            )}
            <div>
              <p className="font-sans text-xs text-brand-black/40 uppercase tracking-button mb-1">Producto</p>
              <p className="font-sans text-sm font-medium">{product.name}</p>
            </div>
          </div>

          {/* Star rating */}
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-button mb-3">Calificación</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarButton
                  key={i}
                  index={i}
                  value={displayRating}
                  onHover={setHoverRating}
                  onClick={v => { setRating(v); setHoverRating(0) }}
                />
              ))}
            </div>
            {rating > 0 && (
              <p className="font-sans text-xs text-brand-black/50 mt-1.5">
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="font-sans text-xs font-semibold uppercase tracking-button mb-2 block">
              Comentario <span className="text-brand-black/40 normal-case">(mínimo 20 caracteres)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Cuéntanos tu experiencia con este producto..."
              className="w-full border border-brand-border px-3 py-2.5 font-sans text-sm resize-none outline-none focus:border-brand-black transition-colors"
            />
            <p className="font-sans text-xs text-brand-black/30 mt-1 text-right">
              {comment.length} / 20 min
            </p>
          </div>

          {/* Photo upload */}
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-button mb-2">
              Foto del producto <span className="text-brand-black/40 normal-case">(opcional, máx. 5 MB)</span>
            </p>
            <label className="flex items-center gap-3 border border-dashed border-brand-border p-3 cursor-pointer hover:border-brand-black transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="font-sans text-sm text-brand-black/60">
                {photo ? photo.name : 'Seleccionar foto'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="font-sans text-xs text-brand-black/40 mt-1 hover:text-brand-black"
              >
                Eliminar foto ✕
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="font-sans text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Subiendo foto…' : submitting ? 'Enviando…' : 'Enviar reseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
