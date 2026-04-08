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
import { sendOrderConfirmedEmail } from './emails.js'

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

// ── Atomically decrement stock + increment total_sold ────────────────────────
async function decrementStock(items, orderId, serviceKey, supabaseUrl) {
  try {
    for (const item of items) {
      if (!item.slug) continue
      const qty = item.quantity ?? 1
      await supabaseRequest(
        'POST', '/rpc/decrement_stock',
        { p_product_slug: item.slug, p_quantity: qty },
        serviceKey, supabaseUrl
      )
      await supabaseRequest(
        'POST', '/rpc/increment_total_sold',
        { p_product_slug: item.slug, p_quantity: qty },
        serviceKey, supabaseUrl
      )
    }
    await supabaseRequest(
      'PATCH', `/orders?id=eq.${orderId}`,
      { stock_decremented: true },
      serviceKey, supabaseUrl
    )
    console.log(`[save-order] Stock decremented + total_sold updated for order ${orderId}`)
  } catch (err) {
    console.warn('[save-order] Stock/sold warning (non-fatal):', err.message)
  }
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
    customer_name, customer_email, customer_phone, customer_id,
    shipping_address, shipping_option, shipping_cost, items = [],
    discount_code, discount_amount,
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
      shipping_address:  shipping_address ?? {},
      shipping_option,
      shipping_cost:     shipping_cost    ?? 0,
      discount_code:     discount_code    || null,
      discount_amount:   discount_amount  || 0,
      ...(customer_id ? { customer_id } : {}),
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

    // ── Decrement stock + increment total_sold on APPROVED orders ───────────────
    if (status === 'APPROVED' && items.length > 0) {
      await decrementStock(items, orderId, serviceKey, supabaseUrl)
    }

    // ── Mark discount code as used ───────────────────────────────────────────
    if (status === 'APPROVED' && discount_code) {
      try {
        // Get current code to read assigned_email and usage_count
        const dcRes = await supabaseRequest('GET',
          `/discount_codes?code=eq.${encodeURIComponent(discount_code)}&select=usage_count,assigned_email`,
          null, serviceKey, supabaseUrl)
        const dc = Array.isArray(dcRes.data) ? dcRes.data[0] : null
        if (dc) {
          await supabaseRequest('PATCH',
            `/discount_codes?code=eq.${encodeURIComponent(discount_code)}`,
            { usage_count: (dc.usage_count || 0) + 1, used_at: new Date().toISOString(), used_by_order_id: orderId },
            serviceKey, supabaseUrl)
          if (dc.assigned_email) {
            await supabaseRequest('PATCH',
              `/newsletter_subscribers?email=eq.${encodeURIComponent(dc.assigned_email)}`,
              { first_order_discount_used: true },
              serviceKey, supabaseUrl)
          }
        }
        console.log(`[save-order] Discount code ${discount_code} marked used for order ${orderId}`)
      } catch (discountErr) {
        console.warn('[save-order] Discount mark warning (non-fatal):', discountErr.message)
      }
    }

    // ── Send confirmation email (awaited so Vercel doesn't terminate early) ────
    if (status === 'APPROVED') {
      try {
        await sendOrderConfirmedEmail({
          customerName:    customer_name,
          customerEmail:   customer_email,
          wompiReference:  wompi_reference,
          orderId,
          items,
          subtotal:        items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0),
          shippingCost:    shipping_cost ?? 0,
          totalAmount:     total_amount,
          shippingAddress: shipping_address ?? {},
          shippingOption:  shipping_option,
        })
      } catch (emailErr) {
        console.warn('[save-order] Email warning (non-fatal):', emailErr.message)
      }
    }

    console.log(`[save-order] Saved order ${orderId} | tx: ${wompi_transaction_id}`)
    return res.status(201).json({ order_id: orderId })
  } catch (err) {
    console.error('[save-order] Unexpected error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
