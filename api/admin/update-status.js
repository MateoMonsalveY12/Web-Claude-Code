/**
 * POST /api/admin/update-status — cookie-authenticated status change + email dispatch
 *
 * Body: { order_id, order_status, tracking_number?, tracking_url? }
 */
import https from 'node:https'
import { verifyAdminSession } from '../_admin-auth.js'
import { sendOrderShippedEmail   } from '../emails/order-shipped.js'
import { sendOrderDeliveredEmail } from '../emails/order-delivered.js'

const VALID_STATUSES = ['PAGO_APROBADO', 'EMPACANDO', 'EN_CAMINO', 'ENTREGADO']

function sbFetch(method, path, body, serviceKey, baseUrl) {
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!verifyAdminSession(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'
  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const { order_id, order_status, tracking_number, tracking_url } = body ?? {}

  if (!order_id) return res.status(400).json({ error: 'order_id required' })
  if (!VALID_STATUSES.includes(order_status))
    return res.status(400).json({ error: `order_status must be one of: ${VALID_STATUSES.join(', ')}` })

  console.log(`[admin/update-status] ${order_id} → ${order_status}`)

  try {
    // Build update payload
    const patch = { order_status }
    if (tracking_number) patch.tracking_number = tracking_number
    if (tracking_url)    patch.tracking_url    = tracking_url
    if (order_status === 'ENTREGADO') patch.delivered_at = new Date().toISOString()

    // Update in Supabase
    const updateRes = await sbFetch('PATCH', `/orders?id=eq.${order_id}`, patch, serviceKey, supabaseUrl)
    if (updateRes.status !== 200 && updateRes.status !== 204) {
      console.error('[admin/update-status] Update failed:', JSON.stringify(updateRes.data))
      return res.status(500).json({ error: 'Failed to update order' })
    }

    // Fetch full order + items for email
    const [orderRes, itemsRes] = await Promise.all([
      sbFetch('GET', `/orders?id=eq.${order_id}&select=*`, null, serviceKey, supabaseUrl),
      sbFetch('GET', `/order_items?order_id=eq.${order_id}&select=*`, null, serviceKey, supabaseUrl),
    ])
    const orderData  = Array.isArray(orderRes.data)  ? orderRes.data[0]  : null
    const orderItems = Array.isArray(itemsRes.data)  ? itemsRes.data     : []

    let emailSent = false

    if (orderData) {
      if (order_status === 'EN_CAMINO') {
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
        } catch (e) { console.error('[admin/update-status] Email shipped error:', e.message) }
      }

      if (order_status === 'ENTREGADO') {
        try {
          await sendOrderDeliveredEmail({
            customerName:   orderData.customer_name,
            customerEmail:  orderData.customer_email,
            wompiReference: orderData.wompi_reference,
            items:          orderItems,
          })
          emailSent = true
        } catch (e) { console.error('[admin/update-status] Email delivered error:', e.message) }
      }
    }

    // Return updated order data
    return res.status(200).json({
      ok: true,
      order_id,
      order_status,
      email_sent: emailSent,
      order: orderData ? { ...orderData, ...patch } : null,
    })
  } catch (err) {
    console.error('[admin/update-status] Unexpected error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
