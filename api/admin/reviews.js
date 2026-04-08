/**
 * GET  /api/admin/reviews  — returns all reviews
 * PATCH /api/admin/reviews?id=<uuid> — toggles visible field
 */
import https from 'node:https'
import { verifyAdminSession } from '../_admin-auth.js'

function sbRequest(method, path, body, serviceKey, baseUrl) {
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
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(raw) }) } catch { resolve({ status: res.statusCode, data: raw }) } })
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
  if (!verifyAdminSession(req)) return res.status(401).json({ error: 'Unauthorized' })

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'
  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  // GET all reviews
  if (req.method === 'GET') {
    try {
      const result = await sbRequest('GET',
        '/reviews?select=id,customer_name,product_name,product_slug,rating,comment,photo_url,created_at,visible&order=created_at.desc',
        null, serviceKey, supabaseUrl)
      return res.status(200).json({ reviews: Array.isArray(result.data) ? result.data : [] })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // PATCH — toggle visible
  if (req.method === 'PATCH') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })

    let body = req.body
    if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
    const { visible } = body ?? {}

    if (typeof visible !== 'boolean') return res.status(400).json({ error: 'visible (boolean) required' })

    try {
      const result = await sbRequest('PATCH', `/reviews?id=eq.${id}`, { visible }, serviceKey, supabaseUrl)
      if (result.status !== 200 && result.status !== 204) {
        return res.status(500).json({ error: 'Update failed' })
      }
      return res.status(200).json({ ok: true, id, visible })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
