import https from 'node:https'
import { verifyAdminSession } from '../_admin-auth.js'

function sbFetch(path, serviceKey, baseUrl) {
  return new Promise((resolve, reject) => {
    const u   = new URL(`${baseUrl}/rest/v1${path}`)
    const req = https.request({
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   'GET',
      headers:  { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }, res => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve([]) } })
    })
    req.on('error', reject)
    req.end()
  })
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!verifyAdminSession(req)) return res.status(401).json({ error: 'Unauthorized' })

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'
  if (!serviceKey) return res.status(500).json({ error: 'Server not configured' })

  try {
    const products = await sbFetch(
      '/products?select=id,name,slug,category,price,compare_price,stock,is_available,images,is_featured,total_sold&order=created_at.desc',
      serviceKey, supabaseUrl
    )
    return res.status(200).json({ products: Array.isArray(products) ? products : [] })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
