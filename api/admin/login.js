import { buildSessionCookie } from '../_admin-auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const { password } = body ?? {}
  const secret = process.env.ADMIN_SECRET

  if (!secret) {
    console.error('[admin/login] ADMIN_SECRET not configured')
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  if (!password || password !== secret) {
    console.warn('[admin/login] Failed login attempt')
    return res.status(401).json({ error: 'Contraseña incorrecta' })
  }

  res.setHeader('Set-Cookie', buildSessionCookie(secret))
  console.log('[admin/login] Session created')
  return res.status(200).json({ ok: true })
}
