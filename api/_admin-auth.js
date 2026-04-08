/**
 * Shared admin authentication helper.
 * Uses an httpOnly cookie set by /api/admin/login.
 * File starts with _ so Vercel does NOT treat it as an endpoint.
 */

export function parseCookies(cookieHeader = '') {
  const cookies = {}
  cookieHeader.split(';').forEach(pair => {
    const idx = pair.indexOf('=')
    if (idx < 0) return
    const key = decodeURIComponent(pair.slice(0, idx).trim())
    const val = decodeURIComponent(pair.slice(idx + 1).trim())
    cookies[key] = val
  })
  return cookies
}

export function verifyAdminSession(req) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return true // dev: no secret = open access
  const cookies = parseCookies(req.headers.cookie)
  return cookies['admin_session'] === secret
}

export function buildSessionCookie(value, maxAge = 7 * 24 * 3600) {
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : ''
  return `admin_session=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export function clearSessionCookie() {
  return `admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
