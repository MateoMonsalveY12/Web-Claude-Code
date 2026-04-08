/**
 * api/admin.js — Consolidated admin handler
 *
 * Routes by ?action= query parameter:
 *
 *   GET  /api/admin?action=check          — verify session
 *   POST /api/admin?action=login          — login (sets httpOnly cookie)
 *   POST /api/admin?action=logout         — logout (clears cookie)
 *   GET  /api/admin?action=orders         — list all orders + items
 *   POST /api/admin?action=update-status  — change order_status + send email
 *   GET  /api/admin?action=products       — list all products
 *   GET  /api/admin?action=reviews        — list all reviews
 *   PATCH /api/admin?action=reviews&id=<uuid> — toggle visible field
 */

import https from 'node:https'
import { verifyAdminSession, buildSessionCookie, clearSessionCookie } from './_admin-auth.js'
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from './emails.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'
const VALID_STATUSES = ['PAGO_APROBADO', 'EMPACANDO', 'EN_CAMINO', 'ENTREGADO']

// ── Supabase helper ────────────────────────────────────────────────────────

function sb(method, path, body, serviceKey) {
  return new Promise((resolve, reject) => {
    const u    = new URL(`${SUPABASE_URL}/rest/v1${path}`)
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

function parseBody(req) {
  let b = req.body
  if (typeof b === 'string') { try { b = JSON.parse(b) } catch { b = {} } }
  return b ?? {}
}

// ── Action handlers ────────────────────────────────────────────────────────

function actionCheck(req, res) {
  if (verifyAdminSession(req)) return res.status(200).json({ authenticated: true })
  return res.status(200).json({ authenticated: false })
}

function actionLogin(req, res) {
  const { password } = parseBody(req)
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    console.error('[admin:login] ADMIN_SECRET not configured')
    return res.status(500).json({ error: 'Server misconfiguration' })
  }
  if (!password || password !== secret) {
    console.warn('[admin:login] Failed login attempt')
    return res.status(401).json({ error: 'Contraseña incorrecta' })
  }
  res.setHeader('Set-Cookie', buildSessionCookie(secret))
  console.log('[admin:login] Session created')
  return res.status(200).json({ ok: true })
}

function actionLogout(_req, res) {
  res.setHeader('Set-Cookie', clearSessionCookie())
  return res.status(200).json({ ok: true })
}

async function actionOrders(req, res, serviceKey) {
  try {
    const [ordersRes, itemsRes] = await Promise.all([
      sb('GET',
        '/orders?select=id,wompi_reference,status,order_status,total_amount,shipping_cost,customer_name,customer_email,customer_phone,shipping_address,shipping_option,created_at,tracking_number,tracking_url,delivered_at&order=created_at.desc',
        null, serviceKey),
      sb('GET',
        '/order_items?select=id,order_id,product_name,product_slug,size,color,quantity,unit_price,subtotal',
        null, serviceKey),
    ])

    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : []
    const items  = Array.isArray(itemsRes.data)  ? itemsRes.data  : []

    const byOrder = {}
    for (const item of items) {
      if (!byOrder[item.order_id]) byOrder[item.order_id] = []
      byOrder[item.order_id].push(item)
    }

    return res.status(200).json({
      orders: orders.map(o => ({ ...o, items: byOrder[o.id] ?? [] })),
    })
  } catch (err) {
    console.error('[admin:orders]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionUpdateStatus(req, res, serviceKey) {
  const { order_id, order_status, tracking_number, tracking_url } = parseBody(req)

  if (!order_id) return res.status(400).json({ error: 'order_id required' })
  if (!VALID_STATUSES.includes(order_status))
    return res.status(400).json({ error: `order_status must be one of: ${VALID_STATUSES.join(', ')}` })

  console.log(`[admin:update-status] ${order_id} → ${order_status}`)

  try {
    const patch = { order_status }
    if (tracking_number) patch.tracking_number = tracking_number
    if (tracking_url)    patch.tracking_url    = tracking_url
    if (order_status === 'ENTREGADO') patch.delivered_at = new Date().toISOString()

    const updateRes = await sb('PATCH', `/orders?id=eq.${order_id}`, patch, serviceKey)
    if (updateRes.status !== 200 && updateRes.status !== 204) {
      console.error('[admin:update-status] Update failed:', JSON.stringify(updateRes.data))
      return res.status(500).json({ error: 'Failed to update order' })
    }

    const [orderRes, itemsRes] = await Promise.all([
      sb('GET', `/orders?id=eq.${order_id}&select=*`, null, serviceKey),
      sb('GET', `/order_items?order_id=eq.${order_id}&select=*`, null, serviceKey),
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
        } catch (e) { console.error('[admin:update-status] Email shipped error:', e.message) }
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
        } catch (e) { console.error('[admin:update-status] Email delivered error:', e.message) }
      }
    }

    return res.status(200).json({
      ok: true, order_id, order_status,
      email_sent: emailSent,
      order: orderData ? { ...orderData, ...patch } : null,
    })
  } catch (err) {
    console.error('[admin:update-status]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionProducts(_req, res, serviceKey) {
  try {
    const result = await sb('GET',
      '/products?select=id,name,slug,category,price,compare_price,stock,is_available,images,is_featured,total_sold&order=created_at.desc',
      null, serviceKey)
    return res.status(200).json({ products: Array.isArray(result.data) ? result.data : [] })
  } catch (err) {
    console.error('[admin:products]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionReviewsGet(_req, res, serviceKey) {
  try {
    const result = await sb('GET',
      '/reviews?select=id,customer_name,product_name,product_slug,rating,comment,photo_url,created_at,visible&order=created_at.desc',
      null, serviceKey)
    return res.status(200).json({ reviews: Array.isArray(result.data) ? result.data : [] })
  } catch (err) {
    console.error('[admin:reviews GET]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionReviewsPatch(req, res, serviceKey) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })
  const { visible } = parseBody(req)
  if (typeof visible !== 'boolean') return res.status(400).json({ error: 'visible (boolean) required' })
  try {
    const result = await sb('PATCH', `/reviews?id=eq.${id}`, { visible }, serviceKey)
    if (result.status !== 200 && result.status !== 204)
      return res.status(500).json({ error: 'Update failed' })
    return res.status(200).json({ ok: true, id, visible })
  } catch (err) {
    console.error('[admin:reviews PATCH]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query

  // ── Unauthenticated actions ──────────────────────────────────────────────
  if (action === 'check')  return actionCheck(req, res)
  if (action === 'login')  return actionLogin(req, res)
  if (action === 'logout') return actionLogout(req, res)

  // ── Auth gate for everything else ────────────────────────────────────────
  if (!verifyAdminSession(req)) return res.status(401).json({ error: 'Unauthorized' })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  // ── Authenticated actions ────────────────────────────────────────────────
  if (action === 'orders')         return actionOrders(req, res, serviceKey)
  if (action === 'update-status')  return actionUpdateStatus(req, res, serviceKey)
  if (action === 'products')       return actionProducts(req, res, serviceKey)
  if (action === 'reviews') {
    if (req.method === 'GET')   return actionReviewsGet(req, res, serviceKey)
    if (req.method === 'PATCH') return actionReviewsPatch(req, res, serviceKey)
  }

  return res.status(404).json({ error: `Unknown action: ${action}` })
}
