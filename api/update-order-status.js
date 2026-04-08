/**
 * Vercel Serverless Function — POST /api/update-order-status
 *
 * Actualiza el order_status de un pedido en Supabase y dispara
 * el email transaccional correspondiente.
 *
 * Usado desde el panel de admin (Sprint 5) y cualquier automatización futura.
 *
 * Body:
 *   {
 *     order_id:        string (uuid) — requerido
 *     order_status:    'PAGO_APROBADO' | 'EMPACANDO' | 'EN_CAMINO' | 'ENTREGADO'
 *     tracking_number: string (opcional, para EN_CAMINO)
 *     tracking_url:    string (opcional, para EN_CAMINO)
 *   }
 *
 * Responde: { ok: true, order_id, order_status, email_sent }
 *
 * Seguridad: requiere header X-Admin-Secret = ADMIN_SECRET env var.
 * Si ADMIN_SECRET no está seteada, cualquier llamada es permitida
 * (modo dev). En producción configura ADMIN_SECRET en Vercel.
 */

import https from 'node:https'
import { sendOrderShippedEmail   } from './emails/order-shipped.js'
import { sendOrderDeliveredEmail } from './emails/order-delivered.js'

const VALID_STATUSES = ['PAGO_APROBADO', 'EMPACANDO', 'EN_CAMINO', 'ENTREGADO']

// ── Supabase helper ────────────────────────────────────────────────────────
function supabaseRequest(method, path, body, serviceKey, baseUrl) {
  return new Promise((resolve, reject) => {
    const u    = new URL(`${baseUrl}/rest/v1${path}`)
    const data = body ? JSON.stringify(body) : null
    const req  = https.request({
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method,
      headers: {
        'Content-Type':  'application/json',
        'apikey':        serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer':        'return=representation',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode, data: raw }) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // ── Auth check ────────────────────────────────────────────────────────────
  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret) {
    const provided = req.headers['x-admin-secret']
    if (provided !== adminSecret) {
      console.warn('[update-order-status] Unauthorized — invalid X-Admin-Secret')
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'

  if (!serviceKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  if (!body || typeof body !== 'object') body = {}

  const { order_id, order_status, tracking_number, tracking_url } = body

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' })
  }
  if (!order_status || !VALID_STATUSES.includes(order_status)) {
    return res.status(400).json({
      error: `order_status must be one of: ${VALID_STATUSES.join(', ')}`,
    })
  }

  console.log(`[update-order-status] Updating order ${order_id} → ${order_status}`)

  try {
    // ── Build update payload ──────────────────────────────────────────────
    const updatePayload = { order_status }
    if (tracking_number) updatePayload.tracking_number = tracking_number
    if (tracking_url)    updatePayload.tracking_url    = tracking_url
    if (order_status === 'ENTREGADO') updatePayload.delivered_at = new Date().toISOString()

    // ── Update order in Supabase ──────────────────────────────────────────
    const updateRes = await supabaseRequest(
      'PATCH',
      `/orders?id=eq.${order_id}`,
      updatePayload,
      serviceKey, supabaseUrl
    )

    if (updateRes.status !== 200 && updateRes.status !== 204) {
      console.error('[update-order-status] Update failed:', JSON.stringify(updateRes.data))
      return res.status(500).json({ error: 'Failed to update order', detail: updateRes.data })
    }
    console.log(`[update-order-status] Order updated successfully`)

    // ── Fetch full order data for email ───────────────────────────────────
    const orderRes = await supabaseRequest(
      'GET',
      `/orders?id=eq.${order_id}&select=*`,
      null, serviceKey, supabaseUrl
    )
    const orderData = Array.isArray(orderRes.data) ? orderRes.data[0] : null

    if (!orderData) {
      console.error('[update-order-status] Could not fetch order after update')
      return res.status(200).json({ ok: true, order_id, order_status, email_sent: false })
    }

    // ── Fetch order items for email ───────────────────────────────────────
    const itemsRes = await supabaseRequest(
      'GET',
      `/order_items?order_id=eq.${order_id}&select=*`,
      null, serviceKey, supabaseUrl
    )
    const orderItems = Array.isArray(itemsRes.data) ? itemsRes.data : []

    // ── Send email based on new status ────────────────────────────────────
    let emailSent = false

    if (order_status === 'EN_CAMINO') {
      console.log('[update-order-status] Disparando email de envío...')
      try {
        await sendOrderShippedEmail({
          customerName:    orderData.customer_name,
          customerEmail:   orderData.customer_email,
          wompiReference:  orderData.wompi_reference,
          trackingNumber:  orderData.tracking_number,
          trackingUrl:     orderData.tracking_url,
          items:           orderItems,
          shippingAddress: orderData.shipping_address ?? {},
        })
        emailSent = true
        console.log('[update-order-status] Email de envío enviado')
      } catch (emailErr) {
        console.error('[update-order-status] Error en email de envío:', emailErr.message)
      }
    }

    if (order_status === 'ENTREGADO') {
      console.log('[update-order-status] Disparando email de entrega...')
      try {
        await sendOrderDeliveredEmail({
          customerName:   orderData.customer_name,
          customerEmail:  orderData.customer_email,
          wompiReference: orderData.wompi_reference,
          items:          orderItems,
        })
        emailSent = true
        console.log('[update-order-status] Email de entrega enviado')
      } catch (emailErr) {
        console.error('[update-order-status] Error en email de entrega:', emailErr.message)
      }
    }

    return res.status(200).json({
      ok: true,
      order_id,
      order_status,
      email_sent: emailSent,
    })

  } catch (err) {
    console.error('[update-order-status] Unexpected error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
