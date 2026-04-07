/**
 * Vercel Serverless Function — /api/wompi-signature
 *
 * Computes the Wompi integrity signature (SHA-256) server-side
 * so the WOMPI_INTEGRITY_SECRET is never exposed to the browser.
 *
 * Formula (exactly):
 *   SHA256( reference + amountInCents + currency + integritySecret )
 *   — all values concatenated with NO separators, as strings
 *
 * ─── ENV VARS REQUIRED ──────────────────────────────────────────────────────
 *   WOMPI_INTEGRITY_SECRET   (Vercel dashboard → Settings → Environment Variables)
 *     Sandbox:    test_integrity_...
 *     Production: prod_integrity_...
 *
 * ─── TO SWITCH FROM SANDBOX TO PRODUCTION ───────────────────────────────────
 *   1. In Wompi dashboard → Developers → Keys, copy PRODUCTION keys.
 *   2. In Vercel dashboard update:
 *      - WOMPI_INTEGRITY_SECRET → prod_integrity_...
 *      - VITE_WOMPI_PUBLIC_KEY  → pub_prod_...
 *      - VITE_WOMPI_ENV         → production
 *   3. Redeploy — no code changes needed.
 */

import crypto from 'node:crypto'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Body parsing (explicit, handles pre-parsed object OR raw string) ──────
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  if (!body || typeof body !== 'object') body = {}

  const { reference, amountInCents, currency } = body

  if (!reference || !amountInCents || !currency) {
    console.error('[wompi-signature] Missing fields:', { reference, amountInCents, currency })
    return res.status(400).json({ error: 'Missing required fields: reference, amountInCents, currency' })
  }

  const secret = process.env.WOMPI_INTEGRITY_SECRET
  if (!secret) {
    console.error('[wompi-signature] WOMPI_INTEGRITY_SECRET is not set in server environment')
    return res.status(500).json({ error: 'WOMPI_INTEGRITY_SECRET not configured. Set it in Vercel → Settings → Environment Variables.' })
  }

  // ── Integrity string: reference + amountInCents + currency + secret ────────
  // All values as strings, NO separators — exactly as Wompi specifies.
  const integrityString = `${reference}${amountInCents}${currency}${secret}`

  const signature = crypto
    .createHash('sha256')
    .update(integrityString)
    .digest('hex')

  console.log(`[wompi-signature] OK | ref=${reference} | amount=${amountInCents} | currency=${currency} | sig=${signature.slice(0, 12)}...`)

  return res.status(200).json({ signature })
}
