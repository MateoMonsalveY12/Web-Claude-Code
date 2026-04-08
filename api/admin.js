/**
 * api/admin.js — Consolidated admin handler
 *
 * Routes by ?action= query parameter:
 *
 *   GET   /api/admin?action=check                    — verify session
 *   POST  /api/admin?action=login                    — login (sets httpOnly cookie)
 *   POST  /api/admin?action=logout                   — logout (clears cookie)
 *   GET   /api/admin?action=orders                   — list all orders + items
 *   POST  /api/admin?action=update-status            — change order_status + send email
 *   GET   /api/admin?action=products                 — list all products
 *   POST  /api/admin?action=product-create           — create new product
 *   PATCH /api/admin?action=product-update&id=<id>   — update product by id
 *   POST  /api/admin?action=product-delete&id=<id>   — soft-delete (is_available=false)
 *   POST  /api/admin?action=product-upload-image     — upload image → product-images bucket
 *   GET   /api/admin?action=reviews                  — list all reviews
 *   PATCH /api/admin?action=reviews&id=<uuid>        — toggle visible field
 *   GET   /api/admin?action=home-sections            — list all home_sections rows
 *   POST  /api/admin?action=home-update-image        — upload + update home_sections image_url
 */

import https from 'node:https'
import crypto from 'node:crypto'
import { verifyAdminSession, buildSessionCookie, clearSessionCookie } from './_admin-auth.js'
import { sendOrderShippedEmail, sendOrderDeliveredEmail, sendWelcomeDiscountEmail } from './emails.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'
const VALID_STATUSES = ['PAGO_APROBADO', 'EMPACANDO', 'EN_CAMINO', 'ENTREGADO']

// ── Supabase REST helper ───────────────────────────────────────────────────────

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

// ── Supabase Storage upload helper ────────────────────────────────────────────

function sbStorageUpload(bucket, filePath, buffer, contentType, serviceKey) {
  return new Promise((resolve, reject) => {
    const u = new URL(`${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`)
    const req = https.request({
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   'POST',
      headers: {
        'Content-Type':   contentType,
        'Authorization':  `Bearer ${serviceKey}`,
        'apikey':         serviceKey,
        'Content-Length': buffer.length,
        'x-upsert':       'true',
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
    req.write(buffer)
    req.end()
  })
}

function storagePublicUrl(bucket, filePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`
}

function parseBody(req) {
  let b = req.body
  if (typeof b === 'string') { try { b = JSON.parse(b) } catch { b = {} } }
  return b ?? {}
}

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Action handlers ────────────────────────────────────────────────────────────

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
        '/orders?select=id,wompi_reference,status,order_status,total_amount,shipping_cost,discount_code,discount_amount,customer_name,customer_email,customer_phone,shipping_address,shipping_option,created_at,tracking_number,tracking_url,delivered_at&order=created_at.desc',
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
      '/products?select=id,name,slug,category,subcategory,fabric,price,compare_price,badge,stock,is_available,images,is_featured,total_sold,description,tags,variants,is_new,is_on_sale,is_basics,is_warm_season&order=created_at.desc',
      null, serviceKey)
    return res.status(200).json({ products: Array.isArray(result.data) ? result.data : [] })
  } catch (err) {
    console.error('[admin:products]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionProductCreate(req, res, serviceKey) {
  const body = parseBody(req)
  const { name, slug: rawSlug, description, category, subcategory, fabric,
          price, compare_price, badge,
          tags, is_available, is_featured,
          is_new, is_on_sale, is_basics, is_warm_season,
          images, variants } = body

  if (!name || !category || !price) {
    return res.status(400).json({ error: 'name, category y price son requeridos' })
  }

  const slug = rawSlug?.trim() || slugify(name)

  const product = {
    name:           name.trim(),
    slug,
    description:    description?.trim() || null,
    category,
    subcategory:    subcategory?.trim() || null,
    fabric:         fabric?.trim() || null,
    price:          Number(price),
    compare_price:  compare_price ? Number(compare_price) : null,
    badge:          badge?.trim() || null,
    tags:           Array.isArray(tags) ? tags : [],
    is_available:   is_available !== false,
    is_featured:    Boolean(is_featured),
    is_new:         Boolean(is_new),
    is_on_sale:     Boolean(is_on_sale),
    is_basics:      Boolean(is_basics),
    is_warm_season: Boolean(is_warm_season),
    images:         Array.isArray(images) ? images : [],
    variants:       Array.isArray(variants) ? variants : [],
    stock:          Array.isArray(variants)
      ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
      : 0,
  }

  try {
    const result = await sb('POST', '/products', product, serviceKey)
    if (result.status !== 201 && result.status !== 200) {
      console.error('[admin:product-create] Error:', JSON.stringify(result.data))
      return res.status(500).json({ error: 'No se pudo crear el producto', detail: result.data })
    }
    const created = Array.isArray(result.data) ? result.data[0] : result.data
    return res.status(201).json({ ok: true, product: created })
  } catch (err) {
    console.error('[admin:product-create]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionProductUpdate(req, res, serviceKey) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id requerido' })

  const body = parseBody(req)
  const { name, slug: rawSlug, description, category, subcategory, fabric,
          price, compare_price, badge,
          tags, is_available, is_featured,
          is_new, is_on_sale, is_basics, is_warm_season,
          images, variants } = body

  const patch = {}
  if (name          !== undefined) { patch.name         = name.trim(); patch.slug = rawSlug?.trim() || slugify(name) }
  if (rawSlug       !== undefined) patch.slug            = rawSlug.trim()
  if (description   !== undefined) patch.description     = description?.trim() || null
  if (category      !== undefined) patch.category        = category
  if (subcategory   !== undefined) patch.subcategory     = subcategory?.trim() || null
  if (fabric        !== undefined) patch.fabric          = fabric?.trim() || null
  if (price         !== undefined) patch.price           = Number(price)
  if (compare_price !== undefined) patch.compare_price   = compare_price ? Number(compare_price) : null
  if (badge         !== undefined) patch.badge           = badge?.trim() || null
  if (tags          !== undefined) patch.tags            = Array.isArray(tags) ? tags : []
  if (is_available  !== undefined) patch.is_available    = Boolean(is_available)
  if (is_featured   !== undefined) patch.is_featured     = Boolean(is_featured)
  if (is_new        !== undefined) patch.is_new          = Boolean(is_new)
  if (is_on_sale    !== undefined) patch.is_on_sale      = Boolean(is_on_sale)
  if (is_basics     !== undefined) patch.is_basics       = Boolean(is_basics)
  if (is_warm_season !== undefined) patch.is_warm_season = Boolean(is_warm_season)
  if (images        !== undefined) patch.images          = Array.isArray(images) ? images : []
  if (variants      !== undefined) {
    patch.variants = Array.isArray(variants) ? variants : []
    patch.stock    = patch.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' })
  }

  try {
    const result = await sb('PATCH', `/products?id=eq.${id}`, patch, serviceKey)
    if (result.status !== 200 && result.status !== 204) {
      console.error('[admin:product-update] Error:', JSON.stringify(result.data))
      return res.status(500).json({ error: 'No se pudo actualizar el producto', detail: result.data })
    }
    const updated = Array.isArray(result.data) ? result.data[0] : result.data
    return res.status(200).json({ ok: true, product: updated })
  } catch (err) {
    console.error('[admin:product-update]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionProductDelete(req, res, serviceKey) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id requerido' })

  try {
    const result = await sb('PATCH', `/products?id=eq.${id}`, { is_available: false }, serviceKey)
    if (result.status !== 200 && result.status !== 204) {
      return res.status(500).json({ error: 'No se pudo archivar el producto' })
    }
    return res.status(200).json({ ok: true, id, archived: true })
  } catch (err) {
    console.error('[admin:product-delete]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionProductUploadImage(req, res, serviceKey) {
  const { imageBase64, mimeType, filename: rawFilename } = parseBody(req)

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'imageBase64 y mimeType son requeridos' })
  }

  const ext      = mimeType.split('/')[1] || 'jpg'
  const filename = rawFilename || `producto-${Date.now()}.${ext}`
  const filePath = `uploads/${filename}`
  const buffer   = Buffer.from(imageBase64, 'base64')

  try {
    const result = await sbStorageUpload('product-images', filePath, buffer, mimeType, serviceKey)
    if (result.status !== 200 && result.status !== 201) {
      console.error('[admin:product-upload-image] Storage error:', JSON.stringify(result.data))
      return res.status(500).json({ error: 'Error al subir la imagen', detail: result.data })
    }
    const url = storagePublicUrl('product-images', filePath)
    return res.status(200).json({ ok: true, url })
  } catch (err) {
    console.error('[admin:product-upload-image]', err.message)
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

async function actionHomeSections(_req, res, serviceKey) {
  try {
    const result = await sb('GET', '/home_sections?select=id,label,image_url,updated_at&order=id.asc', null, serviceKey)
    return res.status(200).json({ sections: Array.isArray(result.data) ? result.data : [] })
  } catch (err) {
    console.error('[admin:home-sections]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionHomeUpdateImage(req, res, serviceKey) {
  const { sectionId, imageBase64, mimeType, filename: rawFilename } = parseBody(req)

  if (!sectionId || !imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'sectionId, imageBase64 y mimeType son requeridos' })
  }

  const ext      = mimeType.split('/')[1] || 'jpg'
  const filename = rawFilename || `${sectionId}-${Date.now()}.${ext}`
  const filePath = `${filename}`
  const buffer   = Buffer.from(imageBase64, 'base64')

  try {
    // Upload to storage
    const uploadResult = await sbStorageUpload('home-images', filePath, buffer, mimeType, serviceKey)
    if (uploadResult.status !== 200 && uploadResult.status !== 201) {
      console.error('[admin:home-update-image] Storage error:', JSON.stringify(uploadResult.data))
      return res.status(500).json({ error: 'Error al subir la imagen al storage', detail: uploadResult.data })
    }

    const imageUrl = storagePublicUrl('home-images', filePath)

    // Update home_sections record
    const dbResult = await sb(
      'PATCH',
      `/home_sections?id=eq.${sectionId}`,
      { image_url: imageUrl, updated_at: new Date().toISOString() },
      serviceKey,
    )
    if (dbResult.status !== 200 && dbResult.status !== 204) {
      console.error('[admin:home-update-image] DB error:', JSON.stringify(dbResult.data))
      return res.status(500).json({ error: 'Error al actualizar la base de datos', detail: dbResult.data })
    }

    console.log(`[admin:home-update-image] ${sectionId} → ${imageUrl}`)
    return res.status(200).json({ ok: true, sectionId, imageUrl })
  } catch (err) {
    console.error('[admin:home-update-image]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ── Public (unauthenticated) action helpers ───────────────────────────────────

function generateCouponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `BIALY10-${suffix}`
}

async function actionNewsletterSubscribe(req, res, serviceKey) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' })
  const { email, source = 'website' } = parseBody(req)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email inválido' })

  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  try {
    // Check if already subscribed
    const existing = await sb('GET', `/newsletter_subscribers?email=eq.${encodeURIComponent(email)}&select=email,welcome_coupon_code,active`, null, serviceKey)
    if (existing.status === 200 && Array.isArray(existing.data) && existing.data.length > 0) {
      const sub = existing.data[0]
      return res.status(200).json({ success: true, status: 'already_subscribed', coupon_code: sub.welcome_coupon_code || null })
    }

    // Generate coupon code and ensure uniqueness (retry on collision)
    let code
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCouponCode()
      const check = await sb('GET', `/discount_codes?code=eq.${encodeURIComponent(code)}&select=code`, null, serviceKey)
      if (!Array.isArray(check.data) || check.data.length === 0) break
    }

    const now = new Date().toISOString()

    // Insert discount_code
    await sb('POST', '/discount_codes', {
      code,
      type:             'percentage',
      value:            10,
      active:           true,
      usage_limit:      1,
      usage_count:      0,
      valid_for:        'first_order',
      min_order_amount: 0,
      assigned_email:   email,
      created_at:       now,
    }, serviceKey)

    // Insert newsletter_subscriber
    await sb('POST', '/newsletter_subscribers', {
      email,
      subscribed_at:          now,
      active:                 true,
      source,
      welcome_coupon_code:    code,
      welcome_coupon_sent_at: now,
      first_order_discount_used: false,
    }, serviceKey)

    // Send welcome email (non-fatal)
    try { await sendWelcomeDiscountEmail({ email, code }) } catch (e) {
      console.warn('[admin:newsletter-subscribe] Email warning:', e.message)
    }

    console.log(`[admin:newsletter-subscribe] ${email} → ${code}`)
    return res.status(200).json({ success: true, status: 'subscribed', coupon_code: code })
  } catch (err) {
    console.error('[admin:newsletter-subscribe]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionValidateDiscount(req, res, serviceKey) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' })
  const { code, email, subtotal = 0 } = parseBody(req)
  if (!code) return res.status(400).json({ valid: false, message: 'Código requerido' })
  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  try {
    const r = await sb('GET', `/discount_codes?code=eq.${encodeURIComponent(code.trim().toUpperCase())}&select=*`, null, serviceKey)
    if (r.status !== 200 || !Array.isArray(r.data) || r.data.length === 0)
      return res.status(200).json({ valid: false, message: 'Código no válido' })

    const dc = r.data[0]
    if (!dc.active)                         return res.status(200).json({ valid: false, message: 'Este código no está activo' })
    if (dc.usage_count >= dc.usage_limit)   return res.status(200).json({ valid: false, message: 'Este código ya fue utilizado' })
    if (subtotal < (dc.min_order_amount || 0))
      return res.status(200).json({ valid: false, message: `Pedido mínimo ${dc.min_order_amount.toLocaleString('es-CO')} COP` })

    // Email match check (only when email provided and code has assigned_email)
    if (email && dc.assigned_email && dc.assigned_email.toLowerCase() !== email.trim().toLowerCase())
      return res.status(200).json({ valid: false, message: 'Este código no pertenece a este correo' })

    // first_order check
    if (dc.valid_for === 'first_order' && dc.assigned_email) {
      const subR = await sb('GET', `/newsletter_subscribers?email=eq.${encodeURIComponent(dc.assigned_email)}&select=first_order_discount_used`, null, serviceKey)
      const sub = Array.isArray(subR.data) ? subR.data[0] : null
      if (sub?.first_order_discount_used)
        return res.status(200).json({ valid: false, message: 'Este código ya fue aplicado en un pedido anterior' })
    }

    const discount_amount = dc.type === 'percentage'
      ? Math.round(subtotal * dc.value / 100)
      : Math.min(dc.value, subtotal)

    return res.status(200).json({
      valid:          true,
      discount_type:  dc.type,
      discount_value: dc.value,
      discount_amount,
      message:        `${dc.type === 'percentage' ? dc.value + '%' : '$ ' + dc.value.toLocaleString('es-CO')} de descuento aplicado`,
    })
  } catch (err) {
    console.error('[admin:validate-discount]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

async function actionMarkDiscountUsed(req, res, serviceKey) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' })
  const { code, order_id } = parseBody(req)
  if (!code || !order_id) return res.status(400).json({ error: 'code and order_id required' })
  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  try {
    // Get current code data
    const r = await sb('GET', `/discount_codes?code=eq.${encodeURIComponent(code)}&select=*`, null, serviceKey)
    if (r.status !== 200 || !Array.isArray(r.data) || r.data.length === 0)
      return res.status(404).json({ error: 'Code not found' })

    const dc  = r.data[0]
    const now = new Date().toISOString()
    const newUsageCount = (dc.usage_count || 0) + 1
    const maxedOut      = newUsageCount >= (dc.usage_limit || 1)

    // Increment usage_count and deactivate if limit reached
    await sb('PATCH', `/discount_codes?code=eq.${encodeURIComponent(code)}`, {
      usage_count:      newUsageCount,
      used_at:          now,
      used_by_order_id: order_id,
      ...(maxedOut ? { active: false } : {}),
    }, serviceKey)
    console.log(`[admin:mark-discount-used] ${code} usage: ${newUsageCount}/${dc.usage_limit}${maxedOut ? ' → desactivado' : ''}`)

    // Mark first_order_discount_used on subscriber
    if (dc.assigned_email) {
      await sb('PATCH', `/newsletter_subscribers?email=eq.${encodeURIComponent(dc.assigned_email)}`, {
        first_order_discount_used: true,
      }, serviceKey)
    }

    console.log(`[admin:mark-discount-used] ${code} → order ${order_id} ✓`)
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[admin:mark-discount-used]', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // ── Unauthenticated actions ──────────────────────────────────────────────────
  if (action === 'check')              return actionCheck(req, res)
  if (action === 'login')              return actionLogin(req, res)
  if (action === 'logout')             return actionLogout(req, res)
  if (action === 'newsletter-subscribe') return actionNewsletterSubscribe(req, res, serviceKey)
  if (action === 'validate-discount')    return actionValidateDiscount(req, res, serviceKey)
  if (action === 'mark-discount-used')   return actionMarkDiscountUsed(req, res, serviceKey)

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (!verifyAdminSession(req)) return res.status(401).json({ error: 'Unauthorized' })
  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  // ── Authenticated actions ────────────────────────────────────────────────────
  if (action === 'orders')               return actionOrders(req, res, serviceKey)
  if (action === 'update-status')        return actionUpdateStatus(req, res, serviceKey)
  if (action === 'products')             return actionProducts(req, res, serviceKey)
  if (action === 'product-create')       return actionProductCreate(req, res, serviceKey)
  if (action === 'product-update')       return actionProductUpdate(req, res, serviceKey)
  if (action === 'product-delete')       return actionProductDelete(req, res, serviceKey)
  if (action === 'product-upload-image') return actionProductUploadImage(req, res, serviceKey)
  if (action === 'home-sections')        return actionHomeSections(req, res, serviceKey)
  if (action === 'home-update-image')    return actionHomeUpdateImage(req, res, serviceKey)

  if (action === 'reviews') {
    if (req.method === 'GET')   return actionReviewsGet(req, res, serviceKey)
    if (req.method === 'PATCH') return actionReviewsPatch(req, res, serviceKey)
  }

  return res.status(404).json({ error: `Unknown action: ${action}` })
}
