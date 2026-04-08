/**
 * Vercel Serverless Function — POST /api/wompi-webhook
 *
 * Receives Wompi transaction events, validates the HMAC checksum,
 * then upserts the order status in Supabase.
 *
 * Wompi sends: POST with JSON body + header x-event-checksum
 * Checksum formula: SHA256(rawBodyString + WOMPI_INTEGRITY_SECRET)
 *
 * Configure the webhook URL in Wompi Dashboard →
 *   Developers → Webhooks → https://bialycol.shop/api/wompi-webhook
 *
 * Required env vars (Vercel server-only):
 *   WOMPI_INTEGRITY_SECRET
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VITE_SUPABASE_URL   (or hardcoded fallback)
 */

import crypto from 'node:crypto'
import https  from 'node:https'
import { sendOrderConfirmedEmail } from './emails.js'

// Disable Vercel's automatic body parsing so we can read the raw body
// for checksum validation (crypto requires the exact bytes Wompi sent)
export const config = {
  api: { bodyParser: false },
}

// ── Supabase helper ────────────────────────────────────────────────────────
function supabaseFetch(method, path, body, serviceKey, baseUrl) {
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

// ── Raw body reader ────────────────────────────────────────────────────────
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

// ── Main handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Always respond 200 to Wompi so it doesn't retry
  if (req.method !== 'POST') return res.status(200).json({ ok: true })

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'
  const secret      = process.env.WOMPI_INTEGRITY_SECRET

  // Read raw body (bodyParser is disabled above)
  let rawBody
  try { rawBody = await readRawBody(req) }
  catch { return res.status(200).json({ ok: true }) }

  // ── Validate checksum ────────────────────────────────────────────────────
  if (secret) {
    const received = req.headers['x-event-checksum']
    if (received) {
      const expected = crypto
        .createHash('sha256')
        .update(rawBody + secret)
        .digest('hex')
      if (received !== expected) {
        console.warn('[wompi-webhook] Invalid checksum — ignoring event')
        return res.status(200).json({ ok: true }) // 200 so Wompi doesn't retry
      }
    }
  }

  // ── Parse event ──────────────────────────────────────────────────────────
  let event
  try { event = JSON.parse(rawBody) }
  catch { return res.status(200).json({ ok: true }) }

  if (event?.event !== 'transaction.updated') {
    return res.status(200).json({ ok: true })
  }

  const tx = event?.data?.transaction
  if (!tx) return res.status(200).json({ ok: true })

  const wompiTxId  = String(tx.id)
  const reference  = tx.reference   ?? ''
  const status     = tx.status      ?? 'UNKNOWN'

  console.log(`[wompi-webhook] tx=${wompiTxId} ref=${reference} status=${status}`)

  if (!serviceKey) {
    console.error('[wompi-webhook] SUPABASE_SERVICE_ROLE_KEY not set')
    return res.status(200).json({ ok: true })
  }

  try {
    // ── Check if order already exists ────────────────────────────────────
    const existing = await supabaseFetch(
      'GET',
      `/orders?wompi_transaction_id=eq.${encodeURIComponent(wompiTxId)}&select=id,status,stock_decremented`,
      null, serviceKey, supabaseUrl
    )

    if (existing.status === 200 && Array.isArray(existing.data) && existing.data.length > 0) {
      // Order exists — update status
      const orderId           = existing.data[0].id
      const prevStatus        = existing.data[0].status
      const alreadyDecremented = existing.data[0].stock_decremented

      if (prevStatus !== status) {
        await supabaseFetch(
          'PATCH',
          `/orders?id=eq.${orderId}`,
          { status },
          serviceKey, supabaseUrl
        )
        console.log(`[wompi-webhook] Updated order ${orderId}: ${prevStatus} → ${status}`)
      }

      // Decrement stock + increment total_sold if APPROVED and not already done
      if (status === 'APPROVED' && !alreadyDecremented) {
        const itemsRes = await supabaseFetch(
          'GET',
          `/order_items?order_id=eq.${orderId}&select=product_slug,quantity`,
          null, serviceKey, supabaseUrl
        )
        const orderItems = Array.isArray(itemsRes.data) ? itemsRes.data : []
        for (const item of orderItems) {
          if (!item.product_slug) continue
          const qty = item.quantity ?? 1
          await supabaseFetch('POST', '/rpc/decrement_stock',
            { p_product_slug: item.product_slug, p_quantity: qty }, serviceKey, supabaseUrl)
          await supabaseFetch('POST', '/rpc/increment_total_sold',
            { p_product_slug: item.product_slug, p_quantity: qty }, serviceKey, supabaseUrl)
        }
        await supabaseFetch('PATCH', `/orders?id=eq.${orderId}`, { stock_decremented: true }, serviceKey, supabaseUrl)
        console.log(`[wompi-webhook] Stock decremented + total_sold updated for order ${orderId}`)
      }

      // Send confirmation email if just became APPROVED
      if (status === 'APPROVED' && prevStatus !== 'APPROVED') {
        const orderRes = await supabaseFetch('GET',
          `/orders?id=eq.${orderId}&select=*`, null, serviceKey, supabaseUrl)
        const orderData = Array.isArray(orderRes.data) ? orderRes.data[0] : null
        const itemsRes2 = await supabaseFetch('GET',
          `/order_items?order_id=eq.${orderId}&select=*`, null, serviceKey, supabaseUrl)
        const orderItems2 = Array.isArray(itemsRes2.data) ? itemsRes2.data : []
        if (orderData) {
          try {
            await sendOrderConfirmedEmail({
              customerName:    orderData.customer_name,
              customerEmail:   orderData.customer_email,
              wompiReference:  orderData.wompi_reference,
              orderId,
              items:           orderItems2,
              shippingCost:    orderData.shipping_cost ?? 0,
              totalAmount:     orderData.total_amount,
              shippingAddress: orderData.shipping_address ?? {},
              shippingOption:  orderData.shipping_option,
            })
          } catch (emailErr) {
            console.warn('[wompi-webhook] Email warning (non-fatal):', emailErr.message)
          }
        }
      }
    } else {
      // No order found — create minimal record from event data
      // Full order data (items etc.) is persisted by OrderConfirmationPage via /api/save-order
      // This path is a fallback for edge cases where the confirmation page wasn't loaded
      const amountCents = tx.amount_in_cents ?? 0
      const total       = amountCents / 100

      const newOrder = {
        wompi_transaction_id: wompiTxId,
        reference,
        status,
        total_amount:   total,
        customer_name:  tx.customer_data?.full_name   ?? '',
        customer_email: tx.customer_email             ?? '',
        customer_phone: tx.customer_data?.phone_number ?? '',
        shipping_address: {},
        shipping_option: '',
      }

      const orderRes = await supabaseFetch('POST', '/orders', newOrder, serviceKey, supabaseUrl)
      if (orderRes.status === 201 && orderRes.data?.[0]?.id) {
        console.log(`[wompi-webhook] Created fallback order ${orderRes.data[0].id}`)
      } else {
        console.error('[wompi-webhook] Failed to create order:', JSON.stringify(orderRes.data))
      }
    }
  } catch (err) {
    console.error('[wompi-webhook] Unexpected error:', err.message)
  }

  return res.status(200).json({ ok: true })
}
