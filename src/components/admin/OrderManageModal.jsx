import { useState } from 'react'

const ORDER_STATUS_CONFIG = {
  PAGO_APROBADO: { label: 'Pago aprobado', color: 'bg-blue-900/40 text-blue-300 border-blue-700' },
  EMPACANDO:     { label: 'Empacando',     color: 'bg-yellow-900/40 text-yellow-300 border-yellow-700' },
  EN_CAMINO:     { label: 'En camino',     color: 'bg-orange-900/40 text-orange-300 border-orange-700' },
  ENTREGADO:     { label: 'Entregado',     color: 'bg-green-900/40 text-green-300 border-green-700' },
}

const NEXT_STATUS = {
  PAGO_APROBADO: ['EMPACANDO'],
  EMPACANDO:     ['EN_CAMINO'],
  EN_CAMINO:     ['ENTREGADO'],
  ENTREGADO:     [],
}

function fmt(n) { return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO') }

function StatusBadge({ status }) {
  const cfg = ORDER_STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' }
  return (
    <span className={`inline-block font-sans text-xs font-semibold px-2.5 py-1 border rounded-sm ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default function OrderManageModal({ order, onClose, onUpdated }) {
  const currentStatus = order.order_status ?? 'PAGO_APROBADO'
  const nextOptions   = NEXT_STATUS[currentStatus] ?? []

  const [newStatus,       setNewStatus]       = useState(nextOptions[0] ?? '')
  const [trackingNumber,  setTrackingNumber]  = useState(order.tracking_number ?? '')
  const [trackingUrl,     setTrackingUrl]     = useState(order.tracking_url ?? 'https://coordinadora.com')
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState('')
  const [toast,           setToast]           = useState('')

  const addr    = order.shipping_address ?? {}
  const addrStr = [addr.address, addr.apt, addr.city, addr.state].filter(Boolean).join(', ')

  async function handleSave() {
    if (!newStatus) return
    if (newStatus === 'EN_CAMINO' && !trackingNumber.trim()) {
      setError('El número de guía es obligatorio para marcar como En camino.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin?action=update-status', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id:        order.id,
          order_status:    newStatus,
          tracking_number: newStatus === 'EN_CAMINO' ? trackingNumber.trim() : undefined,
          tracking_url:    newStatus === 'EN_CAMINO' ? trackingUrl.trim() || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar')

      setToast('Estado actualizado. Email enviado al cliente.')
      onUpdated?.({ ...order, order_status: newStatus, tracking_number: trackingNumber, tracking_url: trackingUrl })
      setTimeout(() => { setToast(''); onClose() }, 1800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <p className="font-sans text-xs text-slate-500 uppercase tracking-widest mb-0.5">Gestionar pedido</p>
            <h2 className="font-sans text-sm font-semibold text-white">
              #{order.wompi_reference?.split('-').slice(-1)[0] ?? order.id.slice(0, 8).toUpperCase()}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Toast */}
          {toast && (
            <div className="bg-green-900/50 border border-green-700 text-green-300 font-sans text-sm px-4 py-2.5 rounded-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {toast}
            </div>
          )}

          {/* Estado actual */}
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs text-slate-400 uppercase tracking-widest">Estado actual:</span>
            <StatusBadge status={currentStatus} />
          </div>

          {/* Datos del cliente */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-2">
            <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-3">Cliente</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-sans text-xs text-slate-500">Nombre</p>
                <p className="font-sans text-sm text-white">{order.customer_name || '—'}</p>
              </div>
              <div>
                <p className="font-sans text-xs text-slate-500">Email</p>
                <p className="font-sans text-sm text-white break-all">{order.customer_email || '—'}</p>
              </div>
              <div>
                <p className="font-sans text-xs text-slate-500">Teléfono</p>
                <p className="font-sans text-sm text-white">{order.customer_phone || '—'}</p>
              </div>
              <div>
                <p className="font-sans text-xs text-slate-500">Envío</p>
                <p className="font-sans text-sm text-white">{order.shipping_option || '—'}</p>
              </div>
            </div>
            {addrStr && (
              <div className="pt-1">
                <p className="font-sans text-xs text-slate-500">Dirección de entrega</p>
                <p className="font-sans text-sm text-white">{addrStr}</p>
              </div>
            )}
          </div>

          {/* Productos */}
          {order.items && order.items.length > 0 && (
            <div>
              <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-3">Productos</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-white truncate">{item.product_name}</p>
                      <div className="flex gap-3 mt-0.5">
                        {item.size  && <span className="font-sans text-xs text-slate-400">Talla: {item.size}</span>}
                        {item.color && <span className="font-sans text-xs text-slate-400">Color: {item.color}</span>}
                        <span className="font-sans text-xs text-slate-400">Cant: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-sans text-sm text-white shrink-0">
                      {fmt(item.subtotal ?? item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between pt-1">
                  <span className="font-sans text-sm text-green-400">
                    Descuento {order.discount_code ? `(${order.discount_code})` : ''}
                  </span>
                  <span className="font-sans text-sm text-green-400">−{fmt(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-700/50 mt-2">
                <span className="font-sans text-sm font-semibold text-white">Total pagado</span>
                <span className="font-sans text-sm font-semibold text-white">{fmt(order.total_amount)}</span>
              </div>
            </div>
          )}

          {/* Tracking existente */}
          {order.tracking_number && (
            <div className="bg-orange-900/20 border border-orange-800/50 rounded px-4 py-3">
              <p className="font-sans text-xs text-orange-400 uppercase tracking-widest mb-1">Número de guía actual</p>
              <p className="font-sans text-sm text-orange-200">{order.tracking_number}</p>
              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                   className="font-sans text-xs text-orange-400 underline mt-1 inline-block">
                  {order.tracking_url}
                </a>
              )}
            </div>
          )}

          {/* ── Cambio de estado ── */}
          {nextOptions.length > 0 ? (
            <div className="border-t border-slate-700 pt-5 space-y-4">
              <p className="font-sans text-xs text-slate-400 uppercase tracking-widest">Cambiar estado</p>

              <div className="flex gap-2 flex-wrap">
                {nextOptions.map(s => {
                  const cfg = ORDER_STATUS_CONFIG[s]
                  return (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={`font-sans text-sm px-4 py-2 border rounded-sm transition-all ${
                        newStatus === s
                          ? `${cfg.color} font-semibold`
                          : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>

              {/* Tracking fields — only when EN_CAMINO */}
              {newStatus === 'EN_CAMINO' && (
                <div className="space-y-3 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div>
                    <label className="font-sans text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
                      Número de guía <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="Ej: 7805432001"
                      className="w-full bg-slate-900 border border-slate-600 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 transition-colors placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
                      URL de rastreo
                    </label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={e => setTrackingUrl(e.target.value)}
                      placeholder="https://coordinadora.com"
                      className="w-full bg-slate-900 border border-slate-600 text-white font-sans text-sm px-3 py-2 rounded outline-none focus:border-slate-400 transition-colors placeholder-slate-600"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="font-sans text-sm text-red-400 bg-red-900/20 border border-red-800/50 px-3 py-2 rounded">
                  {error}
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !newStatus}
                className="w-full bg-white text-slate-900 font-sans text-sm font-semibold py-2.5 rounded hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando…' : `Cambiar a "${ORDER_STATUS_CONFIG[newStatus]?.label ?? newStatus}"`}
              </button>
              <p className="font-sans text-xs text-slate-500 text-center">
                Se enviará automáticamente un email al cliente con el nuevo estado.
              </p>
            </div>
          ) : (
            <div className="border-t border-slate-700 pt-5">
              <p className="font-sans text-sm text-slate-500 text-center">
                Este pedido ha sido entregado. No se pueden hacer más cambios de estado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
