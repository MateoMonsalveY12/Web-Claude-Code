import { verifyAdminSession } from '../_admin-auth.js'

export default async function handler(req, res) {
  if (verifyAdminSession(req)) {
    return res.status(200).json({ authenticated: true })
  }
  return res.status(401).json({ authenticated: false })
}
