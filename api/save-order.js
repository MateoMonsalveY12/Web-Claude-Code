/**
 * Vercel Serverless Function — POST /api/save-order
 *
 * Persists a confirmed Wompi order to Supabase (orders + order_items).
 * Uses SUPABASE_SERVICE_ROLE_KEY so it bypasses RLS — runs server-side only.
 *
 * Body:
 *   {
 *     wompi_transaction_id: string,
 *     wompi_reference:      string,
 *     status:               'APPROVED' | 'PENDING',
 *     total_amount:         number,
 *     customer_name:        string,
 *     customer_email:       string,
 *     customer_phone:       string,
 *     shipping_address:     { address, apt, city, state },
 *     shipping_option:      string,
 *     items: [{ name, slug, size, color, quantity, unit_price }]
 *   }
 *
 * Returns: { order_id } on success, { error } on failure.
 * Idempotent: if wompi_transaction_id already exists, returns the existing order_id.
 */

import https from 'node:https'

function supabaseRequest(method, path, body, serviceKey, supabaseUrl) {
  return new Promise((resolve, reject) => {
    const u    = new URL(`${supabaseUrl}/rest/v1${path}`)
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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'

  if (!serviceKey) {
    console.error('[save-order] SUPABASE_SERVICE_ROLE_KEY not set')
    return res.status(500).json({ error: 'Server not configured' })
  }

  // Parse body
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  if (!body || typeof body !== 'object') body = {}

  const {
    wompi_transaction_id, wompi_reference, status, total_amount,
    customer_name, customer_email, customer_phone,
    shipping_address, shipping_option, items = [],
  } = body

  if (!wompi_transaction_id || !status) {
    return res.status(400).json({ error: 'Missing wompi_transaction_id or status' })
  }

  try {
    // ── Idempotency check ──────────────────────────────────────────────────
    const existing = await supabaseRequest(
      'GET',
      `/orders?wompi_transaction_id=eq.${encodeURIComponent(wompi_transaction_id)}&select=id`,
      null, serviceKey, supabaseUrl
    )
    if (existing.status === 200 && Array.isArray(existing.data) && existing.data.length > 0) {
      console.log(`[save-order] Already saved: ${wompi_transaction_id}`)
      return res.status(200).json({ order_id: existing.data[0].id, already_existed: true })
    }

    // ── Insert order ───────────────────────────────────────────────────────
    const orderPayload = {
      wompi_transaction_id,
      wompi_reference,
      status,
      total_amount,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address: shipping_address ?? {},
      shipping_option,
    }
    const orderRes = await supabaseRequest('POST', '/orders', orderPayload, serviceKey, supabaseUrl)

    if (orderRes.status !== 201 || !Array.isArray(orderRes.data) || !orderRes.data[0]?.id) {
      console.error('[save-order] Order insert failed:', JSON.stringify(orderRes))
      return res.status(500).json({ error: 'Failed to insert order', detail: orderRes.data })
    }

    const orderId = orderRes.data[0].id

    // ── Insert order_items ─────────────────────────────────────────────────
    if (items.length > 0) {
      const itemsPayload = items.map(item => ({
        order_id:     orderId,
        product_name: item.name,
        product_slug: item.slug,
        size:         item.size  ?? null,
        color:        item.color ?? null,
        quantity:     item.quantity ?? 1,
        unit_price:   item.price,
        subtotal:     (item.price ?? 0) * (item.quantity ?? 1),
      }))
      const itemsRes = await supabaseRequest('POST', '/order_items', itemsPayload, serviceKey, supabaseUrl)
      if (itemsRes.status !== 201) {
        console.warn('[save-order] order_items insert warning:', JSON.stringify(itemsRes.data))
      }
    }

    console.log(`[save-order] Saved order ${orderId} | tx: ${wompi_transaction_id}`)
    return res.status(201).json({ order_id: orderId })
  } catch (err) {
    console.error('[save-order] Unexpected error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
