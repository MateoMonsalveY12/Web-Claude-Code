/**
 * GET /api/admin/orders — returns all orders with their items (cookie auth)
 */
import https from 'node:https'
import { verifyAdminSession } from '../_admin-auth.js'

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
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!verifyAdminSession(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'

  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  try {
    // Fetch all orders + all order_items in parallel
    const [ordersRes, itemsRes] = await Promise.all([
      sbFetch('GET',
        '/orders?select=id,wompi_reference,status,order_status,total_amount,shipping_cost,customer_name,customer_email,customer_phone,shipping_address,shipping_option,created_at,tracking_number,tracking_url,delivered_at&order=created_at.desc',
        null, serviceKey, supabaseUrl),
      sbFetch('GET',
        '/order_items?select=id,order_id,product_name,product_slug,size,color,quantity,unit_price,subtotal',
        null, serviceKey, supabaseUrl),
    ])

    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : []
    const items  = Array.isArray(itemsRes.data)  ? itemsRes.data  : []

    // Group items by order_id
    const itemsByOrder = {}
    for (const item of items) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
      itemsByOrder[item.order_id].push(item)
    }

    // Attach items to orders
    const ordersWithItems = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.id] ?? [],
    }))

    return res.status(200).json({ orders: ordersWithItems })
  } catch (err) {
    console.error('[admin/orders] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
