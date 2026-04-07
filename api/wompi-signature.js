/**
 * Vercel Serverless Function — /api/wompi-signature
 *
 * Computes the Wompi integrity signature (SHA-256) server-side
 * so the WOMPI_INTEGRITY_SECRET is never exposed to the browser.
 *
 * Formula: SHA256(reference + amountInCents + currency + integritySecret)
 *
 * ─── ENV VARS REQUIRED (Vercel dashboard → Settings → Environment Variables) ───
 *
 *   WOMPI_INTEGRITY_SECRET   — get from Wompi dashboard → Developers → Keys
 *                              Sandbox:    stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp
 *                              Production: starts with "prod_integrity_"
 *
 * ─── TO SWITCH FROM SANDBOX TO PRODUCTION ───────────────────────────────────────
 *   1. In Wompi dashboard, get your PRODUCTION public key (pub_prod_...) and
 *      integrity secret (prod_integrity_...)
 *   2. Update in Vercel env vars:
 *      - WOMPI_INTEGRITY_SECRET → prod_integrity_...
 *   3. Update in .env (or Vercel):
 *      - VITE_WOMPI_PUBLIC_KEY  → pub_prod_...
 *      - VITE_WOMPI_ENV         → production
 *   4. Re-deploy — no code changes needed.
 */

import crypto from 'node:crypto'

export default function handler(req, res) {
  // CORS headers (allow requests from own domain)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { reference, amountInCents, currency } = req.body ?? {}

  if (!reference || !amountInCents || !currency) {
    return res.status(400).json({ error: 'Missing: reference, amountInCents, currency' })
  }

  const secret = process.env.WOMPI_INTEGRITY_SECRET
  if (!secret) {
    return res.status(500).json({ error: 'WOMPI_INTEGRITY_SECRET not configured in server environment' })
  }

  const signature = crypto
    .createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${secret}`)
    .digest('hex')

  return res.status(200).json({ signature })
}
