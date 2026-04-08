/**
 * api/emails/order-delivered.js
 *
 * Named export: sendOrderDeliveredEmail(data)
 * Default handler: POST /api/emails/order-delivered
 *
 * data: {
 *   customerName, customerEmail,
 *   wompiReference,
 *   items: [{ product_name, size, color, quantity }],
 * }
 *
 * Triggered when order_status changes to ENTREGADO.
 */

import { Resend } from 'resend'

const STAR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#111111" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`
const STAR_EMPTY = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cccccc" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`

function buildHtml(data) {
  const {
    customerName = 'Estimada clienta',
    wompiReference = '',
    items = [],
  } = data

  const stars5 = Array.from({ length: 5 }).map(() => STAR_SVG).join(' ')

  const itemsList = items.map(item => `
    <li style="font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; padding:6px 0; border-bottom:1px solid #eeeeee;">
      ${item.product_name ?? item.name ?? ''}
      ${item.size ? `<span style="color:#666666; font-size:12px;"> &mdash; Talla ${item.size}</span>` : ''}
    </li>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu pedido de Bialy ha sido entregado</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; max-width:600px; width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:40px 40px 24px; text-align:center; border-bottom:1px solid #eeeeee;">
              <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:28px; font-weight:400; letter-spacing:6px; color:#111111;">BIALY</h1>
            </td>
          </tr>

          <!-- Check + heading -->
          <tr>
            <td style="padding:36px 40px 16px; text-align:center;">
              <div style="margin-bottom:24px;">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;">
                  <circle cx="12" cy="12" r="11" fill="#111111"/>
                  <polyline points="7 12 10.5 15.5 17 9" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2 style="margin:0 0 10px; font-family:Georgia,'Times New Roman',serif; font-size:24px; font-weight:400; color:#111111;">Tu pedido ha llegado</h2>
              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; line-height:1.7;">
                Hola ${customerName.split(' ')[0]}, esperamos que estes disfrutando tu nueva prenda de Bialy.
              </p>
            </td>
          </tr>

          <!-- Items -->
          ${items.length > 0 ? `
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 10px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Productos recibidos</p>
              <ul style="margin:0; padding:0; list-style:none;">
                ${itemsList}
              </ul>
            </td>
          </tr>
          ` : ''}

          <!-- Separator -->
          <tr><td style="padding:0 40px;"><div style="height:1px; background:#eeeeee;"></div></td></tr>

          <!-- Review invitation -->
          <tr>
            <td style="padding:36px 40px; text-align:center; background:#fafafa;">
              <p style="margin:0 0 10px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Tu opinion importa</p>
              <h3 style="margin:0 0 10px; font-family:Georgia,'Times New Roman',serif; font-size:18px; font-weight:400; color:#111111;">Califica tu compra</h3>
              <p style="margin:0 0 20px; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666666; line-height:1.7;">
                Tu experiencia ayuda a otras mujeres a elegir mejor.<br>
                Comparte como te queda y como fue tu compra.
              </p>
              <!-- Static stars -->
              <div style="margin-bottom:24px;">
                ${stars5}
              </div>
              <a href="https://bialycol.shop/mi-cuenta/pedidos"
                 style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:14px 32px;">
                Calificar mi compra
              </a>
            </td>
          </tr>

          <!-- Separator -->
          <tr><td style="padding:0 40px;"><div style="height:1px; background:#eeeeee;"></div></td></tr>

          <!-- Thank you -->
          <tr>
            <td style="padding:32px 40px; text-align:center;">
              <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:16px; font-weight:400; color:#111111; line-height:1.8; font-style:italic;">
                "Gracias por elegir Bialy. Cada prenda esta hecha con amor<br>para que te sientas extraordinaria."
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; border-top:1px solid #eeeeee; text-align:center;">
              <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#666666;">
                Bialy Colombia &mdash; Moda femenina
              </p>
              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#aaaaaa;">
                <a href="https://bialycol.shop/privacidad" style="color:#aaaaaa;">Politica de privacidad</a>
                &nbsp;&middot;&nbsp;
                <a href="https://bialycol.shop/terminos" style="color:#aaaaaa;">Terminos y condiciones</a>
                &nbsp;&middot;&nbsp;
                <a href="https://bialycol.shop/mi-cuenta/pedidos" style="color:#aaaaaa;">Ver mis pedidos</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendOrderDeliveredEmail(data) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) { console.warn('[order-delivered] RESEND_API_KEY not set'); return }
  if (!data.customerEmail) { console.warn('[order-delivered] No customer email'); return }
  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from:    'Bialy <onboarding@resend.dev>',
      to:      data.customerEmail,
      subject: 'Tu pedido de Bialy ha sido entregado',
      html:    buildHtml(data),
    })
    console.log('[order-delivered] Sent to', data.customerEmail, result?.id ?? '')
  } catch (err) {
    console.error('[order-delivered] Error:', err.message)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'

  if (body.order_id && serviceKey) {
    const { default: https } = await import('node:https')
    const fetchData = (path) => new Promise((resolve, reject) => {
      const u = new URL(`${supabaseUrl}/rest/v1${path}`)
      https.get({
        hostname: u.hostname, path: u.pathname + u.search,
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      }, res => {
        let raw = ''
        res.on('data', c => raw += c)
        res.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve([]) } })
      }).on('error', reject)
    })

    const [orders, items] = await Promise.all([
      fetchData(`/orders?id=eq.${body.order_id}&select=*`),
      fetchData(`/order_items?order_id=eq.${body.order_id}&select=*`),
    ])
    const order = Array.isArray(orders) ? orders[0] : null
    if (order) {
      await sendOrderDeliveredEmail({
        customerName:   order.customer_name,
        customerEmail:  order.customer_email,
        wompiReference: order.wompi_reference,
        items:          Array.isArray(items) ? items : [],
      })
    }
  } else {
    await sendOrderDeliveredEmail(body)
  }

  return res.status(200).json({ ok: true })
}
